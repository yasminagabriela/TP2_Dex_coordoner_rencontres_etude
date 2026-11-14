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
            res.json(500).json({ erreurs: ['Erreur du serveur.'] });
        }

    })
    .all(methodeNonPermise);


// POST /api/deconnexion
// Invalide le jeton envoyé.
// Réponses : 204, 401, 500
adminRouter.route('/api/deconnexion')
    .post(verifierToken, (req, res) => {

    })
    .all(methodeNonPermise);


// ------ routes protégées (pour les enseignants) ------

// GET /api/admin/travaux
// Travaux ouverts et fermés des cours de l'enseignant, avec le titre du cours.
// Réponses : 200, 401, 500
adminRouter.route('/api/admin/travaux')
    .get(verifierToken, (req, res) => {

    })
    .all(methodeNonPermise);


// PUT /api/travaux/:id
// Corps : { titre, description, type, disponible, remise, ouvert }
// Modifie un travail. Son cours ne peut pas être changé.
// Réponses : 200 ou 204, 400, 401, 403, 404, 500
// Note : pas de .all(405) ici, car GET /api/travaux/:id existe dans public.js.
adminRouter.put('/api/travaux/:id', verifierToken, (req, res) => {
    const travailId = req.params.id;
    const { titre, description, type, disponible, remise, ouvert } = req.body;

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
