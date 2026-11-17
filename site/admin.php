<?php
$titrePage  = 'Dex — Administration';
$scriptPage = 'js/admin.js';
require __DIR__ . '/includes/entete.php';
?>
<div id="app-admin" class="verticalComposition page-admin" v-cloak>

    <section v-if="!jeton" class="section-connexion">
        <h2>Connexion enseignant</h2>
        <p class="erreur" v-if="erreurConnexion">{{ erreurConnexion }}</p>
        <form @submit.prevent="connecter">
            <div class="champ">
                <label for="identifiant">Identifiant</label>
                <input type="text" id="identifiant"v-model.trim="identifiant" required autocomplete="username">
            </div>
            <div class="champ">
                <label for="motDePasse">Mot de passe</label>
                <input id="motDePasse" type="password" v-model="motDePasse" required autocomplete="current-password">
            </div>
            <button type="submit">Se connecter</button>
        </form>
    </section>

    <section v-else class="section-admin">
        <div class="barre-admin">
            <p>Bonjour, <strong>{{ nom }}</strong></p>
            <button type="button" @click="deconnecter">Se déconnecter</button>
        </div>

        <table>
            <thead>
                <tr><th>Cours</th><th>Travail</th><th>Remise</th><th>État</th><th></th></tr>
            </thead>
            <tbody>
                <tr v-for="t in travaux" :key="t.id">
                    <td>{{ t.cours_titre }}</td>
                    <td>{{ t.titre }}</td>
                    <td>{{ t.remise.slice(0, 16) }}</td>
                    <td><span :class="t.ouvert ? 'badge-ouvert' : 'badge-ferme'">{{ t.ouvert ? 'Ouvert' : 'Fermé' }}</span></td>
                    <td><button type="button" @click="ouvrirTravail(t.id)">Modifier</button></td>
                </tr>
            </tbody>
        </table>

        <section v-if="travail" class="section-modifier-travail">
            <h2>Modifier le travail</h2>
            <p class="cours-travail">Cours : {{ travail.cours_titre }}</p>
            <ul class="erreurs"><li v-for="m in erreursTravail" :key="m">{{ m }}</li></ul>

            <form @submit.prevent="enregistrerTravail">
                <div class="champ">
                    <label for="titre">Titre</label>
                    <input type="text" id="titre"v-model="travail.titre" maxlength="150" required>
                </div>
                <div class="champ">
                    <label for="description">Description</label>
                    <textarea id="description" v-model="travail.description" rows="4" required></textarea>
                </div>
                <div class="champ">
                    <label for="type">Type</label>
                    <select id="type" v-model="travail.type">
                        <option value="individuel">Individuel</option>
                        <option value="equipe">Équipe</option>
                    </select>
                </div>
                <div class="champ">
                    <label for="disponible">Disponible le</label>
                    <input id="disponible" type="date" v-model="travail.disponible" required>
                </div>
                <div class="champ">
                    <label for="remise">Remise</label>
                    <input id="remise" type="datetime-local" v-model="travail.remise" required>
                </div>
                <div class="champ champ-case">
                    <label><input type="checkbox" v-model="travail.ouvert"> Travail ouvert aux étudiants</label>
                </div>
                <button type="submit">Enregistrer le travail</button>
            </form>

            <section class="section-creneaux-admin">
                <h2>Créneaux</h2>
                <ul class="erreurs"><li v-for="m in erreursCreneaux" :key="m">{{ m }}</li></ul>
                <table>
                    <thead><tr><th>Début</th><th>Fin</th><th>Réponses</th><th></th></tr></thead>
                    <tbody>
                        <tr v-for="c in travail.creneaux" :key="c.id">
                            <td><input type="datetime-local" v-model="c.debut" aria-label="Début du créneau"></td>
                            <td><input type="datetime-local" v-model="c.fin" aria-label="Fin du créneau"></td>
                            <td>{{ c.nb_reponses }}</td>
                            <td class="actions">
                                <button type="button" @click="enregistrerCreneau(c)">Enregistrer</button>
                                <button type="button" class="btn-danger" @click="demanderSuppression(c)">Supprimer</button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <form @submit.prevent="ajouterCreneau" class="form-ajout-creneau">
                    <h3>Ajouter un créneau</h3>
                    <div class="champ">
                        <label for="nouveau-debut">Début</label>
                        <input id="nouveau-debut" type="datetime-local" v-model="nouveauCreneau.debut" required>
                    </div>
                    <div class="champ">
                        <label for="nouveau-fin">Fin</label>
                        <input id="nouveau-fin" type="datetime-local" v-model="nouveauCreneau.fin" required>
                    </div>
                    <button type="submit">Ajouter</button>
                </form>
            </section>
        </section>
    </section>

    <dialog ref="dialog" class="dialog-suppression">
        <h2>Supprimer ce créneau ?</h2>
        <p>{{ messageSuppression }}</p>
        <div class="actions">
            <button type="button" @click="$refs.dialog.close()">Annuler</button>
            <button type="button" class="btn-danger" @click="confirmerSuppression">Supprimer</button>
        </div>
    </dialog>
</div>
<?php require __DIR__ . '/includes/pied.php'; ?>
