<?php
session_start();
require_once __DIR__ . '/../PDO_connexion_Db/connexion.php';
require_once __DIR__ . '/template.php';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dex — Administration</title>
    <link rel="stylesheet" href="../UI/style.css">
</head>
<body>

<?php afficherEntete('Administration'); ?>

<main class="verticalComposition page-admin">

    <!-------------------- 1. CONNEXION (visible si non connecté) -------------------->
    <section id="section-connexion" class="section-connexion">
        <h2>Connexion enseignant</h2>

        <!-- Message d'erreur (ex. : identifiant ou mot de passe invalide) -->
        <p class="erreur" id="erreur-connexion" hidden></p>

        <form id="form-connexion">
            <div class="champ">
                <label for="identifiant">Identifiant</label>
                <input type="text" id="identifiant" name="identifiant" maxlength="50" required autocomplete="username">
            </div>

            <div class="champ">
                <label for="motDePasse">Mot de passe</label>
                <input type="password" id="motDePasse" name="motDePasse" required autocomplete="current-password">
            </div>

            <button type="submit">Se connecter</button>
        </form>
    </section>


    <!-------------------- 2. ESPACE ENSEIGNANT (visible si connecté) -------------------->
    <section id="section-admin" class="section-admin" hidden>

        <!-- Barre du haut : nom de l'enseignant + déconnexion -->
        <div class="barre-admin">
            <p>Bonjour, <strong id="nom-enseignant">nom du prof</strong></p>
            <button type="button" id="btn-deconnexion">Se déconnecter</button>
        </div>


        <!-------------------- 2a. Liste des travaux de l'enseignant -------------------->
        <section class="liste-travaux-admin">
            <h2>Mes travaux</h2>

            <table>
                <thead>
                    <tr>
                        <th>Cours</th>
                        <th>Travail</th>
                        <th>Remise</th>
                        <th>État</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="tbody-travaux">
                    <!-- Une ligne par travail (ouvert ou fermé) -->
                    <tr>
                        <td>Programmation Web 2</td>
                        <td>TP1 — Gestion de réservations</td>
                        <td>2026-10-18 23:59</td>
                        <td><span class="badge-ouvert">Ouvert</span></td>
                        <td><button type="button" class="btn-modifier" data-travail-id="web2-tp1">Modifier</button></td>
                    </tr>
                </tbody>
            </table>
        </section>


        <!-------------------- 2b. Modifier un travail -------------------->
        <section id="section-modifier-travail" class="section-modifier-travail" hidden>
            <h2>Modifier le travail</h2>
            <p class="cours-travail">Cours : <span id="cours-travail-edit">Programmation Web 2</span></p>

            <!-- Erreurs de validation renvoyées par l'API (400) -->
            <ul class="erreurs" id="erreurs-travail"></ul>

            <form id="form-travail">
                <input type="hidden" id="travail-id" name="id">

                <div class="champ">
                    <label for="titre">Titre</label>
                    <input type="text" id="titre" name="titre" maxlength="150" required>
                </div>

                <div class="champ">
                    <label for="description">Description</label>
                    <textarea id="description" name="description" rows="4" required></textarea>
                </div>

                <div class="champ">
                    <label for="type">Type</label>
                    <select id="type" name="type" required>
                        <option value="individuel">Individuel</option>
                        <option value="equipe">Équipe</option>
                    </select>
                </div>

                <div class="champ">
                    <label for="disponible">Disponible le</label>
                    <input type="date" id="disponible" name="disponible" required>
                </div>

                <div class="champ">
                    <label for="remise">Remise</label>
                    <input type="datetime-local" id="remise" name="remise" required>
                </div>

                <div class="champ champ-case">
                    <label>
                        <input type="checkbox" id="ouvert" name="ouvert">
                        Travail ouvert aux étudiants
                    </label>
                </div>

                <button type="submit">Enregistrer le travail</button>
            </form>


            <!-------------------- 2c. Créneaux du travail -------------------->
            <section class="section-creneaux-admin">
                <h2>Créneaux</h2>

                <ul class="erreurs" id="erreurs-creneaux"></ul>

                <table>
                    <thead>
                        <tr>
                            <th>Début</th>
                            <th>Fin</th>
                            <th>Réponses</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="tbody-creneaux">
                        <!-- Une ligne par créneau. data-nb-reponses sert au message de confirmation. -->
                        <tr data-creneau-id="web2-tp1-01" data-nb-reponses="3">
                            <td><input type="datetime-local" name="debut" aria-label="Début du créneau"></td>
                            <td><input type="datetime-local" name="fin" aria-label="Fin du créneau"></td>
                            <td>3</td>
                            <td class="actions">
                                <button type="button" class="btn-enregistrer-creneau">Enregistrer</button>
                                <button type="button" class="btn-supprimer-creneau btn-danger">Supprimer</button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Ajouter un créneau -->
                <form id="form-ajout-creneau" class="form-ajout-creneau">
                    <h3>Ajouter un créneau</h3>

                    <div class="champ">
                        <label for="nouveau-debut">Début</label>
                        <input type="datetime-local" id="nouveau-debut" name="debut" required>
                    </div>

                    <div class="champ">
                        <label for="nouveau-fin">Fin</label>
                        <input type="datetime-local" id="nouveau-fin" name="fin" required>
                    </div>

                    <button type="submit">Ajouter</button>
                </form>
            </section>
        </section>

    </section>


    <!-------------------- 3. CONFIRMATION DE SUPPRESSION D'UN CRÉNEAU -------------------->
    <!-- Ouvrir avec dialog.showModal() ; remplir #nb-reponses-suppression avec le nombre de réponses. -->
    <dialog id="dialog-suppression" class="dialog-suppression">
        <form method="dialog">
            <h2>Supprimer ce créneau ?</h2>
            <p id="texte-suppression"></p>

            <div class="actions">
                <button type="submit" value="annuler">Annuler</button>
                <button type="submit" value="confirmer" class="btn-danger">Supprimer</button>
            </div>
        </form>
    </dialog>

</main>

<?php afficherPied(); ?>
<script src="../vue/admin.js"></script>

</body>
</html>
