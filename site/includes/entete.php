<?php?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($titrePage) ?></title>
    <link rel="stylesheet" href="css/style.css?v=<?= filemtime(__DIR__ . '/../css/style.css') ?>">
</head>
<body>
 <header class='navbar'>
        <a href='index.php' class='logo'>DEX</a>
        <nav>
            <a href='index.php'>Accueil</a>
            <a href='admin.php' class='lien-connexion'>Se connecter</a>
        </nav>
    </header>
<main>