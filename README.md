# Dex — coordonner les rencontres d'étude

TP2 — Yasmina Gabriela Cabrera

Dex aide les étudiants à coordonner leurs rencontres d'équipe : chacun coche ses
disponibilités pour un travail et Dex met en évidence les meilleurs créneaux.

## Architecture

| Partie   | Technologie                | Rôle |
|----------|----------------------------|------|
| Base     | MySQL (XAMPP), `DexAppBD`  | Cours, travaux, créneaux, disponibilités, utilisateurs |
| API      | Node.js, Express, mysql2   | Seule partie qui lit et écrit dans la base |
| Site     | PHP (Apache)               | Cadre des pages, routage, page 404 |
| Interface| Vue.js 3 (CDN)             | Appelle l'API avec fetch et affiche les données |

## Fonctionnalités

### Étudiants
- Liste des travaux ouverts, filtrée par cours sans rechargement.
- Choix des disponibilités et grille mise à jour sans rechargement.
- Matricule et nom retenus dans `localStorage` ; les créneaux déjà choisis sont cochés.

### Enseignants (administration)
- Connexion par jeton (conservé dans `sessionStorage`).
- Modification d'un travail : titre, description, type, dates, ouvert/fermé.
- Ajout, modification et suppression de créneaux, avec confirmation indiquant
  le nombre de réponses supprimées.

## Installation

### 1. Base de données
Démarrer MySQL dans XAMPP, puis importer `init.sql` :
- phpMyAdmin → onglet **Importer** → choisir `init.sql`, ou
- `mysql -u root < init.sql`

Le script crée `DexAppBD` et peut être relancé sans erreur ni doublon.

### 2. API
À la racine du projet :
```bash
npm install
npm start
```
L'API écoute sur `http://localhost:3000/api`.

### 3. Site
Démarrer Apache dans XAMPP et ouvrir :
`http://localhost/TP2_Dex_coordoner_rencontres_etude/site/index.php`

## Comptes de démonstration

| Identifiant | Mot de passe | Nom           | Cours                  |
|-------------|--------------|---------------|------------------------|
| prof        | dex2026      | Claire Dubois | 420-245-AH, 420-248-AH |
| prof2       | web2026      | Marc Tremblay | 420-244-AH, 420-253-AH |

## Structure du projet
```
├── init.sql              Création de la base DexAppBD et données de départ
├── package.json          Dépendances et script « npm start » de l'API
├── api/
│   ├── server.js         Démarrage d'Express, CORS, réponses 404 et erreurs en JSON
│   ├── db.js             Pool de connexions MySQL (mysql2)
│   └── routes/
│       ├── public.js     Routes des étudiants (cours, travaux, disponibilités)
│       └── admin.js      Connexion par jeton et routes des enseignants
└── site/
    ├── index.php         Accueil : liste des travaux ouverts
    ├── travail.php       Un travail : choix des disponibilités
    ├── admin.php         Administration des travaux et des créneaux
    ├── 404.php           Page introuvable
    ├── includes/         En-tête et pied de page communs
    ├── js/               Applications Vue et appels à l'API (api.js, config.js)
    ├── css/              Feuille de style
    └── images/
```