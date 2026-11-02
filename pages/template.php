
<!--
en-tête et pied de page partagés avec include ou require.

--->

<?php
function afficherEntete(string $titre = 'Dex'): void
{
    // Bonus session : on affiche le nom de l'utilisateur courant s'il existe
    /*$nomCourant = $_SESSION['nom'] ?? null; */
    echo "
    <header class='navbar'>
        <a href='index.php' class='logo'>DEX</a>
        <nav>
            <a href='index.php'>Accueil</a>
        </nav>
    </header>
    ";

}


function afficherPied(): void {
echo "
    <footer>
        <p>DexTP</p>
        <p>Yasmina Gabriela Cabrera</p>
        <img class='signatureYC' src='../UI/images/YC_signature.png' alt='Yasmina_SIGNATURE'>
        <p>2026</p>
    </footer>
";
}
?>
