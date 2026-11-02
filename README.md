# Dex — coordonner les rencontres d'étude d'un cours

TP2 — Yasmina Gabriela Cabrera

Dex aide les étudiants à coordonner leurs rencontres d'équipe : chacun coche ses disponibilités pour un travail et l'app met en évidence les meilleurs créneaux. Architecture en trois couches : API Express (Node.js), site PHP (cadre et routage) et interface Vue.js. Inclut une page d'administration protégée pour l'enseignant.

## Du TP1 au TP2

Au TP1, Dex était une application PHP classique, avec un rendu entièrement côté serveur : chaque clic rechargeait une page complète construite par le serveur.

Le TP2 reprend le même outil, mais répartit le travail entre trois parties :

- **API Express (Node.js)** : seule couche qui communique avec la base de données.
- **Site PHP** : fournit le cadre commun des pages (en-tête, pied de page) et le routage.
- **Interface Vue.js** : affiche les données, gère les interactions utilisateur et communique avec l'API.

Une **page d'administration protégée** s'ajoute : l'enseignant peut s'y connecter pour modifier un travail et ses créneaux.

## Contenu du projet

<!-- À ajuster selon les noms réels des dossiers et fichiers -->

```
TP2_Dex_coordoner_rencontres_etude/
├── api/                  (API Express)
│   ├── package.json
│   └── server.js         (point d'entrée, routes, connexion à DexBD)
├── pages/                (site PHP)
│   ├── index.php         (accueil : travaux ouverts, filtre par cours)
│   ├── travail.php       (détails d'un travail et disponibilités)
│   ├── admin.php         (administration protégée)
│   └── template.php      (en-tête, pied de page et fonctions partagées)
├── vue/                  (composants et scripts Vue.js)
├── UI/
│   ├── style.css
│   └── images/
│       ├── Background_leaves.png
│       └── YC_signature.png
└── README.md
```

## Mise en place

1. **Placer le projet** dans le dossier `htdocs` de XAMPP
   (par défaut `C:\xampp\htdocs\`).
2. **Démarrer Apache et MySQL** dans le panneau de contrôle XAMPP (boutons *Start*).
3. **Vérifier les identifiants MySQL** dans la configuration de l'API.
   Par défaut : utilisateur `root`, mot de passe vide.
4. **Installer et lancer l'API** :

   ```bash
   cd api
   npm install
   node server.js
   ```

   L'API écoute par défaut sur `http://localhost:3000`.
5. **Initialiser la base de données** si elle n'existe pas encore : le script
   crée la base **DexBD**, les tables (`cours`, `travaux`, `creneaux`,
   `disponibilites`) et insère le jeu de données initial. Il peut être relancé
   sans erreur et sans doublon.
6. **Ouvrir l'application** :
   `http://localhost/TP2_Dex_coordoner_rencontres_etude/pages/index.php`

## Utilisation

1. Sur la page d'accueil, les travaux ouverts sont regroupés par cours.
   Le menu déroulant permet de n'afficher qu'un seul cours.
2. Cliquer sur **voir travail** pour ouvrir la page d'un travail.
3. Saisir son **matricule** et son **nom**, cocher les créneaux où l'on est
   disponible, puis cliquer sur **Enregistrer mes disponibilités**.
4. Le tableau affiche, pour chaque créneau, le nombre d'étudiants disponibles
   et leurs noms. Les meilleurs créneaux sont mis en évidence.
5. Pour modifier sa réponse, soumettre de nouveau le formulaire avec le même
   matricule : les anciennes disponibilités de ce travail sont remplacées.

## Administration

1. Ouvrir la page d'administration :
   `http://localhost/TP2_Dex_coordoner_rencontres_etude/pages/admin.php`
2. Se connecter avec le compte enseignant.
3. Modifier les informations d'un travail (titre, description, type, dates)
   et ses créneaux, puis enregistrer.
