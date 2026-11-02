<?php

session_start();
require_once __DIR__ . '/../PDO_connexion_Db/connexion.php';
require_once __DIR__ . '/template.php';


// Tous les cours, pour le menu déroulant du filtre
$listeCours = $pdo->query("SELECT id, titre FROM cours ORDER BY titre")->fetchAll(PDO::FETCH_ASSOC);

// Tableau associatif : l'id du cours devient la clé, le titre la valeur
$titresCours = array_column($listeCours, 'titre', 'id');

// faire le filtre par cours
$filtre = $_GET['cours'] ?? '';
if(!is_string($filtre) || !isset($titresCours[$filtre])) {
    $filtre = ''; 
}



// Récupérer les travaux ouverts de la DB
// ici j'ai appris à séparer le sql de variables comme ca je peux le réutiliser 
$sql = "
    SELECT id, cours_id, titre, description, type, disponible, remise
    FROM travaux
    WHERE ouvert = 1
";


$params = [];

if ($filtre !== '') {
    $sql .= " AND cours_id = ?";
    $params[] = $filtre;
}

$sql .= " ORDER BY cours_id, remise";

$requete = $pdo->prepare($sql);
$requete->execute($params);
$travaux = $requete->fetchAll(PDO::FETCH_ASSOC);


$parCours = [];
foreach ($travaux as $travail) {
    $parCours[$travail['cours_id']][] = $travail;
}



?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dex</title>
    <link rel="stylesheet" href="../UI/style.css">
</head>
<body>

<!---Header-->
<?php 
afficherEntete();
?>


<div class="verticalComposition">



    <!---Ajouter ici un texte pour dire bonjour à l'étudiant-->


    <!--------------FILTRER------------>

<form method="get" action="index.php">
    <select name="cours" id="cours">
        <option value="">Tous les cours</option>
        <?php foreach ($listeCours as $cours): ?>
            <option value="<?= htmlspecialchars($cours['id']) ?>"
                <?= $cours['id'] === $filtre ? 'selected' : '' ?>>
                <?= htmlspecialchars($cours['titre']) ?>
            </option>
        <?php endforeach; ?>
    </select>
    <button type="submit">Filtrer</button>
</form>



<div class="card-cours">

<?php if (empty($parCours)): ?>
    <p>Aucun travail ouvert pour ce cours.</p>
<?php endif; ?>

<?php foreach ($parCours as $coursId => $travauxDuCours): ?>
    <h2 class="titre-cours"><?= htmlspecialchars($titresCours[$coursId]) ?></h2>

    <?php foreach ($travauxDuCours as $travail): ?>
        <div class="travaux">
            <h2 class="titre-travail"><?= htmlspecialchars($travail['titre']) ?></h2>
            <h3 class="type-travail"><?= htmlspecialchars($travail['type']) ?></h3>
            <p class="description-travail"><?= htmlspecialchars($travail['description']) ?></p>

            <div class="badges">
                <span class="date-travail"><?= htmlspecialchars($travail['remise']) ?></span>
                <span class="disponible"><?= htmlspecialchars($travail['disponible']) ?></span>
            </div>

            <a href="travail.php?travail=<?= urlencode($travail['id']) ?>">voir travail</a>
        </div>
    <?php endforeach; ?>

<?php endforeach; ?>

</div>


</div>

<!---footer-->
<?php 
afficherPied();
?>

</body>
</html>