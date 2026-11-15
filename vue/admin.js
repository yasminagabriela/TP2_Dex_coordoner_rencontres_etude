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
    chargerTravaux();
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



// ---------- variables pour afficher page admin.php --------

const tbodyTravaux        = document.getElementById('tbody-travaux');
const sectionModifier     = document.getElementById('section-modifier-travail');
const coursTravailEdit    = document.getElementById('cours-travail-edit');
const erreursTravail      = document.getElementById('erreurs-travail');
const formTravail         = document.getElementById('form-travail');
const champTravailId      = document.getElementById('travail-id');
const champTitre          = document.getElementById('titre');
const champDescription    = document.getElementById('description');
const champType           = document.getElementById('type');
const champDisponible     = document.getElementById('disponible');
const champRemise         = document.getElementById('remise');
const champOuvert         = document.getElementById('ouvert');
const erreursCreneaux     = document.getElementById('erreurs-creneaux');
const tbodyCreneaux       = document.getElementById('tbody-creneaux');



// --------- fonctions pour bien afficher ----------


// "2026-10-18 23:59:00" (MySQL) → "2026-10-18T23:59" (champ datetime-local)
function versChampDateHeure(valeurSql) {
    return valeurSql.replace(' ', 'T').slice(0, 16);
}

// "2026-10-18 23:59:00" → "2026-10-18 23:59" (pour l'affichage)
function versTexte(valeurSql) {
    return valeurSql.slice(0, 16);
}


function afficherErreurs(liste, erreurs) {
    liste.replaceChildren();
    for (const erreur of erreurs) {
        const li = document.createElement('li');
        li.textContent = erreur;
        liste.append(li);
    }
}

// Crée une cellule <td> avec du texte.
function cellule(texte) {
    const td = document.createElement('td');
    td.textContent = texte;
    return td;
}




// -------- charger les travaux ----------

async function chargerTravaux() {
    const reponse = await fetchAdmin('/api/admin/travaux');
    if(!reponse.ok) return;

    const travaux = await reponse.json();
    tbodyTravaux.replaceChildren();

    for (const travail of travaux) {
        const tr = document.createElement('tr');
        tr.append(
            cellule(travail.cours_titre),
            cellule(travail.titre),
            cellule(versTexte(travail.remise))
        );

        const tdEtat = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = travail.ouvert ? 'badge-ouvert' : 'badge-ferme';
        badge.textContent = travail.ouvert ? 'Ouvert' : 'Fermé';
        tdEtat.append(badge);



        const tdAction = document.createElement('td');
        const bouton = document.createElement('button');
        bouton.type = 'button';
        bouton.textContent = 'Modifier';
        bouton.addEventListener('click', () => ouvrirTravail(travail.id));
        tdAction.append(bouton);

        tr.append(tdEtat, tdAction);
        tbodyTravaux.append(tr);

    }


}


// ---------- vérifie si déjà connecté ----------

const nomSauvegarde = sessionStorage.getItem('nom');
if (sessionStorage.getItem('jeton') !== null && nomSauvegarde !== null) {
    afficherAdmin(nomSauvegarde);
}