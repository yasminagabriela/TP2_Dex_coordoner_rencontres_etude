# Dex — coordonner les rencontres d'étude d'un cours

TP1 — Yasmina Gabriela Cabrera

Dex est une petite application Web en PHP qui permet à des étudiants d'indiquer leurs disponibilités pour un travail et qui met en évidence les créneaux convenant au plus grand nombre.



## Contenu du projet

```
TP1_Dex_coordoner_rencontres_etude/
├── PDO_connexion_Db/
│   ├── connexion.php    (connexion PDO à DexBD)
│   └── init.php         (création des tables et des données initiales)
├── pages/
│   ├── index.php        (accueil : travaux ouverts, filtre par cours)
│   ├── travail.php      (détails d'un travail, formulaire, disponibilités)
│   └── template.php     (en-tête, pied de page et fonctions partagées)
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
3. **Vérifier les identifiants MySQL** dans `PDO_connexion_Db/connexion.php` et
   `PDO_connexion_Db/init.php`. Par défaut : utilisateur `root`, mot de passe vide.
4. **Initialiser la base de données** en ouvrant dans le navigateur :
   `http://localhost/TP1_Dex_coordoner_rencontres_etude/PDO_connexion_Db/init.php`

   Le script crée la base **DexBD**, les quatre tables (`cours`, `travaux`,
   `creneaux`, `disponibilites`) et insère le jeu de données initial.
   Il peut être relancé sans erreur et sans doublon.
5. **Ouvrir l'application** :
   `http://localhost/TP1_Dex_coordoner_rencontres_etude/pages/index.php`

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