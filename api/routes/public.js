import { Router } from 'express';
import pool from '../db.js';

const publicRouter = Router();

// Répond 405 quand la méthode n'est pas permise sur une adresse existante.
function methodeNonPermise(req, res) {
    res.status(405).json({ erreurs: ['Méthode non permise.'] });
}


// ------ routes publiques (pour les étudiants) ------




// GET /api/cours
// Liste des cours.
// Réponses : 200, 500
publicRouter.route('/api/cours')
    .get( async (req, res) => {
        try {
            const [cours] = await pool.execute(
                'SELECT id, titre FROM cours ORDER BY titre'
            );
        } catch (erreur) {
            console.error(erreur);
            res.status(500).json({ erreurs : ['Erreur du server.']});
        }
    })
    .all(methodeNonPermise);






// GET /api/travaux  (optionnel : ?cours=<id>)
// Liste des travaux OUVERTS, peut être limitée à un cours avec req.query.cours.
// Réponses : 200, 500
publicRouter.route('/api/travaux')
    .get( async (req, res) => {
        const coursId = req.query.cours; // undefined si absent
        let sql = `
            SELECT travaux.id, travaux.cours_id, cours.titre AS cours_titre,
                   travaux.titre, travaux.description, travaux.type,
                   travaux.disponible, travaux.remise
            FROM travaux
            JOIN cours ON cours.id = travaux.cours_id
            WHERE travaux.ouvert = 1`;
        const params = [];


        if (coursId !== undefined && coursId !== '') {
            if (typeof coursId !== 'string') {
                return res.status(400).json({erreurs : ['Le filtre de cours est invalide']});
            }
            sql += ' AND travaux.cours_id = ?';
            params.push(coursId);
        }


        sql += 'ORDER BY cours.titre, travaux.remise'


        try {
            const [travaux] = await pool.execute(sql, params);
            res.status(200).json(travaux);
        } catch(erreur) {
            console.error(erreur);
            res.status(500).json({ erreurs : ['Erreur du serveur.'] });
        }
    })
    .all(methodeNonPermise);


// GET /api/travaux/:id
// Un travail (ouvert ou fermé) avec ses créneaux.
// Réponses : 200, 404, 500
// Note : pas de .all(405) ici, car PUT /api/travaux/:id existe dans admin.js.
publicRouter.get('/api/travaux/:id', async (req, res) => {
    const travailId = req.params.id;


    try{
        const [travaux] = await pool.execute(`
            SELECT travaux.id, travaux.cours_id, cours.titre AS cours_titre,
                   travaux.titre, travaux.description, travaux.type,
                   travaux.disponible, travaux.remise, travaux.ouvert
            FROM travaux
            JOIN cours ON cours.id = travaux.cours_id
            WHERE travaux.id = ?
        `, [travailId]);

        if(travaux.length === 0) {
            return res.status(404).json({ erreurs : ['Travail introuvable.'] });
        }


        const [creneaux] = await pool.execute(`
            SELECT creneaux.id, creneaux.debut, creneaux.fin,
                   COUNT(disponibilites.id) AS nb_reponses
            FROM creneaux
            LEFT JOIN disponibilites ON disponibilites.creneau_id = creneaux.id
            WHERE creneaux.travail_id = ?
            GROUP BY creneaux.id, creneaux.debut, creneaux.fin
            ORDER BY creneaux.debut
        `, [travailId]);


        res.status(200).json({ ...travaux[0], creneaux });


    } catch(erreur) {
        console.error(erreur);
        res.status(500).json({ erreurs : ['Erreur du serveur.'] });
    }

});






// GET /api/travaux/:id/disponibilites
// Pour chaque créneau : le nombre d'étudiants disponibles et leurs noms.
// Réponses : 200, 404, 500
publicRouter.route('/api/travaux/:id/disponibilites')
    .get( async (req, res) => {
        const travailId = req.params.id;
        const matricule = typeof req.query.matricule === 'string' ? req.query.matricule.trim() : '';

        try {
            const [travaux] = await pool.execute('SELECT id FROM travaux WHERE id = ?', [travailId]);

            if (travaux.length === 0) {
                return res.status(404).json({ erreurs : ['Travail introuvable.'] });
            }

            const [lignes] = await pool.execute(`
                SELECT creneaux.id, creneaux.debut, creneaux.fin,
                       disponibilites.matricule, disponibilites.nom
                FROM creneaux
                LEFT JOIN disponibilites ON disponibilites.creneau_id = creneaux.id
                WHERE creneaux.travail_id = ?
                ORDER BY creneaux.debut, disponibilites.nom
            `, [travailId]);



            // pour regrouper par row
          const parCreneau = new Map();
            for (const ligne of lignes) {
                if (!parCreneau.has(ligne.id)) {
                    parCreneau.set(ligne.id, {
                        id: ligne.id, debut: ligne.debut, fin: ligne.fin,
                        nombre: 0, noms: [], choisi: false
                    });
                }
                const creneau = parCreneau.get(ligne.id);
                if (ligne.nom !== null) {
                    creneau.nombre++;
                    creneau.noms.push(ligne.nom);
                    if (matricule !== '' && ligne.matricule === matricule) {
                        creneau.choisi = true;
                    }
                }
            }
            res.status(200).json([...parCreneau.values()]);


        } catch (erreur) {
            console.error(erreur);
            res.status(500).json({ erreurs : ['Erreur du serveur.']});
        }
    })
    .all(methodeNonPermise);






// PUT /api/travaux/:id/disponibilites/:matricule
// Corps : { nom, creneaux: [...] }
// Remplace la réponse de cet étudiant pour ce travail.
// Réponses : 204, 400 (ex. créneau qui n'appartient pas au travail), 404, 409 (travail fermé), 500
publicRouter.route('/api/travaux/:id/disponibilites/:matricule')
    .put( async (req, res) => {
        const travailId = req.params.id;
        const matricule = req.params.matricule.trim();
        const { nom, creneaux } = req.body ?? {};
        let connexion;

        try {
            const [travaux] = await pool.execute(
                'SELECT id, ouvert FROM travaux WHERE id = ?',
                 [travailId]
                );

                if (travaux.length === 0) {
                    return res.status(404).json({ erreurs : ['Travail introuvable.'] });
                } 

                if (!travaux[0].ouvert) {
                    return res.status(409).json({ erreurs : ["Ce travail est fermé et il n'accepte plus de réponses."] });
                }



                const erreurs = [];

                if (matricule === '' || matricule.length > 20) {
                    erreurs.push('Le matricule est obligatoire (20 caractères maximum).');
                }
                if (typeof nom !== 'string' || nom.trim() === '' || nom.trim().length > 100) {
                    erreurs.push('Le nom est obligatoire (100 caractères maximum).');
                }
                if (!Array.isArray(creneaux) || creneaux.length === 0
                    || !creneaux.every(id => typeof id === 'string')) {
                    erreurs.push('Sélectionnez au moins un créneau.');
                } else {
                    const [valides] = await pool.execute(
                        'SELECT id FROM creneaux WHERE travail_id = ?', [travailId]);
                    const idsValides = new Set(valides.map(c => c.id));
                    if (!creneaux.every(id => idsValides.has(id))) {
                        erreurs.push('Un des créneaux ne fait pas partie de ce travail.');
                    }
                }
                if (erreurs.length > 0) {
                    return res.status(400).json({ erreurs });
                }

                const uniques = [ ...new Set(creneaux)];

                connexion = await pool.execute( 'DELETE FROM disponibilites WHERE travail_id = ? AND matricule = ?',
                [travailId, matricule]);

                for (const creneauId of uniques) {
                    await connexion.execute('INSERT INTO disponibilites (travail_id, creneau_id, matricule, nom) VALUES (?, ?, ?, ?)',
                    [travailId, creneauId, matricule, nom.trim()]);
                }
            
                await connexion.commit();
                res.status(204).end();


        } catch (erreur) {
            if(connexion) await connexion.rollback().catch(() => {});
            console.error(erreur);
            res.status(500).json({ erreurs : ['Erreur du serveur'] });
        } finally {
            connexion?.release();
        }

    })
    .all(methodeNonPermise);


export default publicRouter;
