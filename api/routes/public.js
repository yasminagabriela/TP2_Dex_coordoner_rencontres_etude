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
    .get((req, res) => {

    })
    .all(methodeNonPermise);


// GET /api/travaux  (optionnel : ?cours=<id>)
// Liste des travaux OUVERTS, peut être limitée à un cours avec req.query.cours.
// Réponses : 200, 500
publicRouter.route('/api/travaux')
    .get((req, res) => {
        const coursId = req.query.cours; // undefined si absent

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
    .get((req, res) => {
        const travailId = req.params.id;

    })
    .all(methodeNonPermise);


// PUT /api/travaux/:id/disponibilites/:matricule
// Corps : { nom, creneaux: [...] }
// Remplace la réponse de cet étudiant pour ce travail.
// Réponses : 204, 400 (ex. créneau qui n'appartient pas au travail), 404, 409 (travail fermé), 500
publicRouter.route('/api/travaux/:id/disponibilites/:matricule')
    .put((req, res) => {
        const travailId = req.params.id;
        const matricule = req.params.matricule;
        const { nom, creneaux } = req.body;

    })
    .all(methodeNonPermise);


export default publicRouter;
