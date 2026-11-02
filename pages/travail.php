<?php

//--------------------- Connection à la session ------------------------

session_start();
require_once __DIR__ . '/../PDO_connexion_Db/connexion.php';
require_once __DIR__ . '/template.php';

// Initialiser la session
if (!isset($_SESSION['travail'])) {
    $_SESSION['travail'] = [];
}



// ----------------- récupéerer d'une base de données ----------------------


// 1. Read and check the id from the URL
$travailId = $_GET['travail'] ?? '';

if (!is_string($travailId) || $travailId === '') {
    header('Location: index.php');
    exit;
}

$requete = $pdo->prepare("
    SELECT travaux.id, travaux.titre, travaux.description, travaux.type,
           travaux.disponible, travaux.remise,
           cours.titre AS cours_titre
    FROM travaux
    JOIN cours ON cours.id = travaux.cours_id
    WHERE travaux.id = ?
");
$requete->execute([$travailId]);
$travail = $requete->fetch(PDO::FETCH_ASSOC);




// ---------------------------- creneaux ------------------------------------

$requete = $pdo->prepare("
    SELECT id, debut,
    fin FROM creneaux 
    WHERE travail_id = ? 
    ORDER BY debut
    ");

$requete->execute([$travailId]);
$creneaux = $requete->fetchAll(PDO::FETCH_ASSOC);

// Ids that belong to THIS travail (needed to validate the form late    r)
$idsValides = array_column($creneaux, 'id');



// 3. If nothing was found, go back to the home page
if (!$travail) {
    header('Location: index.php');
    exit;
}



// ---------------------------- disponibilitées --------------------------------
// pour récupérer des datas de la db, il faut que tu prépare une requête SQL

$requete = $pdo->prepare("
    SELECT creneau_id, matricule, nom 
    FROM disponibilites
    WHERE travail_id = ?
");
$requete->execute([$travailId]);
$lignes = $requete->fetchAll(PDO::FETCH_ASSOC);

// pour les disponibilitées, il faut que tu met dans un array un tableau qui associe chaque travail avec des noms.
$dispos = [];

foreach($lignes as $ligne) {
    $dispos[$ligne['creneau_id']][] = $ligne['nom'];
}

/*
ICI, cest la même chose que les lignes en haut mais avec plus d'étapes (ceci est plus lisible)
$cle = $ligne['creneau_id'];       // 'bdd-tp1-01'

if (!isset($dispos[$cle])) {       // si la liste n'existe pas encore...
    $dispos[$cle] = [];            // ...on la crée vide
}

$dispos[$cle][] = $ligne['nom'];   // on ajoute le nom à la fin
*/



// ----- pour classer le top 3 -------

// Copier la liste des créneaux, puis la trier du plus populaire au moins populaire
$classement = $creneaux;
usort($classement, function ($a, $b) use ($dispos) {
    return count($dispos[$b['id']] ?? []) <=> count($dispos[$a['id']] ?? []);
});

// Garder les 3 premiers
$top3 = array_slice($classement, 0, 3);



// ---------------------------- form ------------------------------------

$erreurs = [];
$matricule = '';
$nom = '';
$selection = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // 1. Lire les données (en vérifiant leur type)
    $matricule = is_string($_POST['matricule'] ?? null) ? trim($_POST['matricule']) : '';
    $nom = is_string($_POST['nom'] ?? null) ? trim($_POST['nom']) : '';
    $selection = $_POST['creneaux'] ?? [];

    if (!is_array($selection)) {
        $selection = [];
    }
    $selection = array_unique($selection);

    // 2. Valider
    if ($matricule === '' || mb_strlen($matricule) > 20) {
        $erreurs[] = "Le matricule est obligatoire (20 caractères maximum).";
    }
    if ($nom === '' || mb_strlen($nom) > 100) {
        $erreurs[] = "Le nom est obligatoire (100 caractères maximum).";
    }
    if (count($selection) === 0) {
        $erreurs[] = "Sélectionne au moins un créneau.";
    }
    foreach ($selection as $idCreneau) {
        if (!is_string($idCreneau) || !in_array($idCreneau, $idsValides, true)) {
            $erreurs[] = "Un des créneaux sélectionnés est invalide.";
            break;
        }
    }

    // 3. Enregistrer, seulement s'il n'y a aucune erreur
    if (empty($erreurs)) {
        try {
            $pdo->beginTransaction();

            // Remplacer les anciennes réponses de cet étudiant pour ce travail
            $suppression = $pdo->prepare("
                DELETE FROM disponibilites
                WHERE travail_id = ? AND matricule = ?
            ");
            $suppression->execute([$travailId, $matricule]);

            // Ajouter les nouvelles
            $insertion = $pdo->prepare("
                INSERT INTO disponibilites (travail_id, creneau_id, matricule, nom)
                VALUES (?, ?, ?, ?)
            ");
            foreach ($selection as $idCreneau) {
                $insertion->execute([$travailId, $idCreneau, $matricule, $nom]);
            }

            $pdo->commit();

            // Rediriger : un rafraîchissement ne renverra pas le formulaire
            header('Location: travail.php?travail=' . urlencode($travailId));
            exit;

        } catch (PDOException $e) {
            $pdo->rollBack();
            $erreurs[] = "Erreur lors de l'enregistrement. Réessaie.";
        }
    }
}

?>


<!--------------------- HTML ------------------------>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" href="../UI/style.css">
</head>
<body>


<?php afficherEntete() ?>

<main class="page-travail">

    <!--------------------- afficher le travail (colored) ------------------------>
    <section class="detail-travail">
        <h2 class="titre-travail"><?= htmlspecialchars($travail['titre']) ?></h2>
        <h3 class="cours-travail"><?= htmlspecialchars($travail['cours_titre']) ?></h3>
        <h3 class="type-travail"><?= htmlspecialchars($travail['type']) ?></h3>

        <div class="badges">
            <span class="date-travail">Remise : <?= htmlspecialchars($travail['remise']) ?></span>
            <span class="disponible">Disponible : <?= htmlspecialchars($travail['disponible']) ?></span>
        </div>

        <p class="description-travail"><?= htmlspecialchars($travail['description']) ?></p>
    </section>


    <!--------------------- Choisir les créneaux (no background) ------------------------>
<section class="section-creneaux">
    <h2>Choisir créneaux</h2>
    <?php foreach ($erreurs as $erreur): ?>
        <p class="erreur"><?= htmlspecialchars($erreur) ?></p>
    <?php endforeach; ?>
    <form method="post" action="travail.php?travail=<?= urlencode($travailId) ?>">

        <div class="champ">
            <label for="matricule">Matricule</label>
            <input type="text" id="matricule" name="matricule" value="<?= htmlspecialchars($matricule) ?>">
        </div>

        <div class="champ">
            <label for="nom">Nom</label>
            <input type="text" id="nom" name="nom" value="<?= htmlspecialchars($nom) ?>">
        </div>

        <div class="liste-creneaux">
            <?php foreach ($creneaux as $creneau): ?>
                <label class="creneau-option">
                    <input type="checkbox" name="creneaux[]"
                           value="<?= htmlspecialchars($creneau['id']) ?>"
                           <?= in_array($creneau['id'], $selection, true) ? 'checked' : '' ?>>
                    <?= htmlspecialchars($creneau['debut']) ?> → <?= htmlspecialchars($creneau['fin']) ?>
                </label>
            <?php endforeach; ?>
        </div>

        <button type="submit">Enregistrer mes disponibilités</button>
    </form>
</section>


    <!---------------------TOP 3 dispos (no background)------------------------>
    <section class="section-top3">
        <h2>TOP 3 Meilleurs disponibilités</h2>
        <table>
            <tr>
                <th>Créneau</th>
                <th>Disponibles</th>
                <th>Noms</th>
            </tr>
            <?php foreach ($top3 as $creneau):
                $noms = $dispos[$creneau['id']] ?? [];

                $dateRemise = date_create($creneau['fin']);
                $dateRemiseFormat = date_format($dateRemise, 'j, F');
            ?>
                <tr>
                    <td><?= htmlspecialchars($dateRemiseFormat) ?></td>
                    <td><?= count($noms) ?></td>
                    <td><?= htmlspecialchars(implode(', ', $noms)) ?></td>
                </tr>
            <?php endforeach; ?>
        </table>
    </section>

</main>

<?php afficherPied() ?>

</body>
</html>