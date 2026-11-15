// ici va être la logique de admin.php liée avec l'api php

const API = 'http://localhost:3000';

// ---- variables -----
const sectionConnexion = document.getElementById('section-connexion');
const sectionAdmin = document.getElementById('section-admin');
const formConnexion = document.getElementById('form-connexion');
const champIdentifiant = document.getElementById('identifiant');
const champMotDePasse  = document.getElementById('motDePasse');
const erreurConnexion  = document.getElementById('erreur-connexion');
const nomEnseignant    = document.getElementById('nom-enseignant');
const btnDeconnexion   = document.getElementById('btn-deconnexion');



// afficher une section ou l'autre


function afficherAdmin(nom) {
    nomEnseignant.textContent = nom;
    sectionConnexion.hidden = true;
    sectionAdmin.hidden = false;
}

function afficherConnexion() {
    sectionAdmin.hidden = true;
    sectionConnexion.hidden = false;
}

function afficherErreur(message) {
    erreurConnexion.textContent = message;
    erreurConnexion.hidden = false;
}



// ------------ Connexion -------------
formConnexion.addEventListener('submit', async (evenement) => {
    evenement.preventDefault(); 
    erreurConnexion.hidden = true;

    try {
        const reponse = await fetch(`${API}/api/connexion`, {
            method: 'POST',
            headers : { 'Content-Type' : 'application/json' },
            body : JSON.stringify({
                identifiant : champIdentifiant.value.trim(),
                motDePasse: champMotDePasse.value
            })
        });


        const donnees = await reponse.json();
        if (!reponse.ok) {
            afficherErreur(donnees.erreurs.join(' '));
            return;
        }

        sessionStorage.setItem('jeton', donnees.jeton);
        sessionStorage.setItem('nom', donnees.nom);
        formConnexion.reset();
        afficherAdmin(donnees.nom);

    } catch {
        afficherErreur("Impossible de joindre l'API, à vérifier si server.js marche")
    }
});



// ------------ Déconnexion ---------

btnDeconnexion.addEventListener('click', async () => {
    const jeton = sessionStorage.getItem('jeton');

    try {
        await fetch(`${API}/api/deconnexion`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${jeton}` }
        });
    } catch {
        // Même si l'API ne répond pas, on déconnecte côté page.
    }

    sessionStorage.removeItem('jeton');
    sessionStorage.removeItem('nom');
    afficherConnexion();
});




// ---------- Pour les prochaines routes protégées ----------
// Ajoute le jeton automatiquement. Si l'API répond 401, retour à la connexion.

async function fetchAdmin(url, options = {}) {
    const reponse = await fetch(`${API}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('jeton')}`,
            ...options.headers
        }
    });

    if (reponse.status === 401) {
        sessionStorage.removeItem('jeton');
        sessionStorage.removeItem('nom');
        afficherConnexion();
        afficherErreur('Votre session a expiré. Reconnectez-vous.');
    }

    return reponse;
}


// ---------- vérifie si déjà connecté ----------

const nomSauvegarde = sessionStorage.getItem('nom');
if (sessionStorage.getItem('jeton') !== null && nomSauvegarde !== null) {
    afficherAdmin(nomSauvegarde);
}