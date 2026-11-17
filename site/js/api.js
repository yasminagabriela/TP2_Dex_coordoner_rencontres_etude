import { API_URL } from './config.js';


export class ErreurApi extends Error {
    constructor(statut, erreurs) {
        super(erreurs.join(' '));
        this.statut = statut;
        this.erreurs = erreurs;
    }
}

async function requete(chemin, { methode = 'GET', corps, jeton } = {}) {
    const entetes = {};
    if (corps !== undefined) entetes['Content-Type'] = 'application/json';
    if (jeton) entetes['Authorization'] = `Bearer ${jeton}`;

    let reponse;
    try {
        reponse = await fetch(API_URL + chemin, {
            method: methode,
            headers: entetes,
            body: corps === undefined ? undefined : JSON.stringify(corps)
        });
    } catch {
        throw new ErreurApi(0, ["Impossible de joindre l'API. Est-elle démarrée ?"]);
    }

    if (reponse.status === 204) return null;            // no body
    const donnees = await reponse.json().catch(() => null);
    if (!reponse.ok) {
        throw new ErreurApi(reponse.status, donnees?.erreurs ?? ['Erreur inattendue.']);
    }
    return donnees;
}

const e = encodeURIComponent;



// --- public ---
export const getCours = () => requete('/cours');

export const getTravaux = (coursId = '') =>
    requete('/travaux' + (coursId ? `?cours=${e(coursId)}` : ''));


export const getTravail = (id) => requete(`/travaux/${e(id)}`);

export const getDisponibilites = (id, matricule = '') =>
    requete(`/travaux/${e(id)}/disponibilites` + (matricule ? `?matricule=${e(matricule)}` : ''));


export const enregistrerDisponibilites = (id, matricule, nom, creneaux) =>
    requete(`/travaux/${e(id)}/disponibilites/${e(matricule)}`,
            { methode: 'PUT', corps: { nom, creneaux } });





// --- authentication ---
export const connexion = (identifiant, motDePasse) =>
    requete('/connexion', { methode: 'POST', corps: { identifiant, motDePasse } });

export const deconnexion = (jeton) =>
    requete('/deconnexion', { methode: 'POST', jeton });




// --- admin ---
export const getTravauxAdmin = (jeton) => requete('/admin/travaux', { jeton });

export const modifierTravail = (jeton, id, travail) =>
    requete(`/travaux/${e(id)}`, { methode: 'PUT', corps: travail, jeton });


export const ajouterCreneau = (jeton, travailId, creneau) =>
    requete(`/travaux/${e(travailId)}/creneaux`, { methode: 'POST', corps: creneau, jeton });


export const modifierCreneau = (jeton, id, creneau) =>
    requete(`/creneaux/${e(id)}`, { methode: 'PUT', corps: creneau, jeton });


export const supprimerCreneau = (jeton, id) =>
    requete(`/creneaux/${e(id)}`, { methode: 'DELETE', jeton });
