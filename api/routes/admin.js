import { Router } from 'express';

const adminRouter = Router();

// Répond 405 quand la méthode n'est pas permise sur une adresse existante.
function methodeNonPermise(req, res) {
    res.status(405).json({ erreurs: ['Méthode non permise.'] });
}

// Middleware d'authentification, à ajouter seulement sur les routes protégées.
// Vérifie l'en-tête « Authorization: Bearer <token> » :
// jeton présent, connu et non expiré, sinon 401.
function verifierToken(req, res, next) {
    // TODO : lire req.headers.authorization, valider le jeton,
    //        puis garder l'utilisateur dans req.utilisateur.
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
    .post((req, res) => {
        const { identifiant, motDePasse } = req.body;

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
