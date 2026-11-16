import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import pool from '../db.js';

const adminRouter = Router();
const jetons = new Map();
const DUREE_JETON = 2 * 60 * 60 * 1000; // ceci est supposé d'être 2 heures (en millisecondes)


// Répond 405 quand la méthode n'est pas permise sur une adresse existante.
function methodeNonPermise(req, res) {
    res.status(405).json({ erreurs: ['Méthode non permise.'] });
}

// Middleware d'authentification, à ajouter seulement sur les routes protégées.
// Vérifie l'en-tête « Authorization: Bearer <token> » :
// jeton présent, connu et non expiré, sinon 401.
//  « Est-ce que la personne qui fait cette requête est un enseignant connecté ? »
function verifierToken(req, res, next) {
   const entete = req.headers.authorization ?? '';
   const [type, jeton] = entete.split(' ');

    if(type !== 'Bearer' || !jeton) {
        return res.status(401).json({ erreurs : ['Jeton manquant.'] });
    }

    const session = jetons.get(jeton);

    if(!session || session.expiration < Date.now()) {
        jetons.delete(jeton);
        return res.status(401).json({ erreurs : ['Jeton invalide ou expiré. Reconnectez-vous.'] });
    }
    req.utilisateur = session;
    req.jeton = jeton;
    next();
}



// ---------- outils de l'API -----------

function lireDateHeure(valeur) {
    if (typeof valeur !== 'String')  return null;

    const morceaux = valeur.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!morceaux) return null;

    const [, annee, mois, jour, heure, minute, seconde = '00'] = morceaux;  
    
    
    const date = new Date(Number(annee), Number(mois) - 1, Number(jour));
    if (date.getMonth() !== Number(mois) - 1 || date.getDate() !== Number(jour)) return null;
    if (Number(heure) > 23 || Number(minute) > 59 || Number(seconde) > 59) return null;

    return `${annee}-${mois}-${jour} ${heure}:${minute}:${seconde}`;
}




// Accepte "2026-09-21". Retourne la même chaîne, ou null.
function lireDate(valeur) {
    if (typeof valeur !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return null;
    return lireDateHeure(`${valeur} 00:00`) ? valeur : null;
}




// Valide { debut, fin } d'un créneau. Retourne { erreurs, debut, fin }.
function validerCreneau(corps) {
    const debut = lireDateHeure(corps?.debut);
    const fin = lireDateHeure(corps?.fin);
    const erreurs = [];

    if (!debut) erreurs.push('Le début est obligatoire et doit être une date valide.');
    if (!fin) erreurs.push('La fin est obligatoire et doit être une date valide.');
    if (debut && fin && debut >= fin) erreurs.push('La fin doit être après le début.');

    return { erreurs, debut, fin };
}


async function chercherTravail(travailId) {
    const [lignes] = await pool.execute(`
        SELECT travaux.id, cours.utilisateur_id
        FROM travaux
        JOIN cours ON cours.id = travaux.cours_id
        WHERE travaux.id = ?
    `, [travailId]);
    return lignes[0];
}


async function chercherCreneau(creneauId) {
    const [lignes] = await pool.execute(`
        SELECT creneaux.id, creneaux.travail_id, cours.utilisateur_id
        FROM creneaux
        JOIN travaux ON travaux.id = creneaux.travail_id
        JOIN cours   ON cours.id   = travaux.cours_id
        WHERE creneaux.id = ?
    `, [creneauId]); 
    return lignes[0];
}



// Ordre des vérifications pour les routes protégées :
// 1. jeton valide (401)
// 2. le travail ou le créneau existe (404)
// 3. il appartient à un cours de l'enseignant connecté (403)
// 4. les données reçues sont valides (400)


// ------ routes d'authentification ------

// POST /api/connexion
// Corps : { identifiant, motDePasse }
// Cherche l'utilisateur (requête préparée), vérifie le mot de passe (bcrypt), retourne un jeton.
// Réponses : 200 (avec jeton), 400, 401, 500
adminRouter.route('/api/connexion')
    .post( async(req, res) => {
        const { identifiant, motDePasse } = req.body ?? {};

        // Validation (400)
        if(typeof identifiant !== 'string' || identifiant.trim() === '' || typeof motDePasse !== 'string' || motDePasse === '') {
            return res.status(400).json({erreurs : ['Identifiant et mot de passe obligatoires.'] })
        }

        // chercher enseignant
        try {
            const [lignes] = await pool.execute(
                'SELECT id, nom, mot_de_passe_hache FROM utilisateurs WHERE identifiant = ?',
                [identifiant.trim()]
            );

            const utilisateur = lignes[0];

            // ici on va comparer le mdp avec bycrpt
            const valide = utilisateur
            ? await bcrypt.compare(motDePasse, utilisateur.mot_de_passe_hache)
            : false;

            if (!valide) {
                return res.status(401).json({erreurs : ['Identifiant ou Mot de passe invalide.'] });
            }

            // créer un token
            const jeton = crypto.randomBytes(32).toString('hex');
            jetons.set(jeton, {
                id : utilisateur.id,
                nom: utilisateur.nom,
                expiration : Date.now() + DUREE_JETON
            });

            res.status(200).json({jeton, nom: utilisateur.nom});

        } catch (erreur) {
            console.error(erreur);
            res.status(500).json({ erreurs: ['Erreur du serveur.'] });
        }

    })
    .all(methodeNonPermise);


// POST /api/deconnexion
// Invalide le jeton envoyé.
// Réponses : 204, 401, 500
adminRouter.route('/api/deconnexion')
    .post(verifierToken, (req, res) => {
        jetons.delete(req.jeton);
        res.status(204).end();
    })
    .all(methodeNonPermise);






// ------ routes protégées (pour les enseignants) ------

// GET /api/admin/travaux
// Travaux ouverts et fermés des cours de l'enseignant, avec le titre du cours.
// Réponses : 200, 401, 500
adminRouter.route('/api/admin/travaux')
    .get(verifierToken, async (req, res) => {
        try {

            const [travaux] = await pool.execute(`
                SELECT travaux.id, travaux.cours_id, cours.titre AS cours_titre,
                       travaux.titre, travaux.description, travaux.type,
                       travaux.disponible, travaux.remise, travaux.ouvert
                FROM travaux
                JOIN cours ON cours.id = travaux.cours_id
                WHERE cours.utilisateur_id = ?
                ORDER BY cours.titre, travaux.remise
            `, [req.utilisateur.id]
            );

            res.status(200).json(travaux);


        } catch (erreur) {
            console.error(erreur);
            res.status(500).json({ erreurs: ['Erreur du serveur.'] });
        }

    })
    .all(methodeNonPermise);


// PUT /api/travaux/:id
// Corps : { titre, description, type, disponible, remise, ouvert }
// Modifie un travail. Son cours ne peut pas être changé.
// Réponses : 200 ou 204, 400, 401, 403, 404, 500
// Note : pas de .all(405) ici, car GET /api/travaux/:id existe dans public.js.
adminRouter.put('/api/travaux/:id', verifierToken, async (req, res) => {
    const travailId = req.params.id;

    try {
        const travail = await chercherTravail(travailId);

        if (!travail) {
            return res.status(404).json({erreurs : ["Travail introuvable"] });

        } if(travail.utilisateur_id !== req.utilisateur.id) {
            return res.status(403).json({ erreurs : ["Ce travail n'appartient pas à vos cours."] });
        }

        const { titre, description, type, disponible, remise, ouvert } = req.body ?? {};
        const dateDisponible = lireDate(disponible);
        const dateRemise = lireDateHeure(remise);
        const erreurs = [];


        if(typeof titre !== 'string' || titre.trim() === '' || titre.trim().length > 150) {
            erreurs.push("Le titre est obligatoitre.");
        }
        if(typeof description !== 'string' || description.trim()){
            erreurs.push("La description est obligatoire");
        }
        
        if (type !== 'individuel' && type !== 'equipe') {
            erreurs.push('Le type doit être « individuel » ou « equipe ».');
        }
        if (!dateDisponible) {
            erreurs.push('La date de disponibilité est invalide.');
        }
        if (!dateRemise) {
            erreurs.push('La date de remise est invalide.');
        }
        if (dateDisponible && dateRemise && dateRemise.slice(0, 10) < dateDisponible) {
            erreurs.push('La remise doit être après la date de disponibilité.');
        }
        if (typeof ouvert !== 'boolean') {
            erreurs.push('Le champ « ouvert » doit être vrai ou faux.');
        }

        if (erreurs.length > 0) {
            return res.status(400).json({ erreurs });
        }

        // Pas de cours_id dans le UPDATE : le cours ne peut pas changer.
        await pool.execute(`
            UPDATE travaux
            SET titre = ?, description = ?, type = ?, disponible = ?, remise = ?, ouvert = ?
            WHERE id = ?
        `, [titre.trim(), description.trim(), type, dateDisponible, dateRemise, ouvert, travailId]);

        res.status(204).end();

    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ erreurs : ['Erreur de server.'] });
    }

});


// POST /api/travaux/:id/creneaux
// Corps : { debut, fin }
// Ajoute un créneau au travail. L'id est généré : <id du travail>-NN (ex. web2-tp1-04).
// Réponses : 201, 400, 401, 403, 404, 500
adminRouter.route('/api/travaux/:id/creneaux')
    .post(verifierToken, (req, res) => {
        const travailId = req.params.id;
        const { debut, fin } = req.body;

    })
    .all(methodeNonPermise);


// PUT /api/creneaux/:id
// Corps : { debut, fin }
// Modifie les heures d'un créneau. Son travail ne peut pas être changé.
// Réponses : 200 ou 204, 400, 401, 403, 404, 500
//
// DELETE /api/creneaux/:id
// Supprime un créneau (ses disponibilités sont supprimées en cascade).
// Réponses : 204, 401, 403, 404, 500
adminRouter.route('/api/creneaux/:id')
    .put(verifierToken, (req, res) => {
        const creneauId = req.params.id;
        const { debut, fin } = req.body;

    })
    .delete(verifierToken, (req, res) => {
        const creneauId = req.params.id;

    })
    .all(methodeNonPermise);


export default adminRouter;
