<?php
$travailId = $_GET['travail'] ?? null;

// PHP vérifie seulement le FORMAT de l'id. C'est l'API qui sait si le travail existe.
if (!is_string($travailId) || !preg_match('/^[a-z0-9-]{1,30}$/', $travailId)) {
    http_response_code(404);
    require __DIR__ . '/404.php';
    exit;
}

$titrePage  = 'Dex — Travail';
$scriptPage = 'js/travail.js';
require __DIR__ . '/includes/entete.php';
?>
<div id="app-travail" data-travail-id="<?= htmlspecialchars($travailId) ?>" v-cloak>
    <p v-if="erreur" class="erreur">{{ erreur }}</p>

    <template v-if="travail">
        <section class="detail-travail">
            <h2 class="titre-travail">{{ travail.titre }}</h2>
            <h3 class="cours-travail">{{ travail.cours_titre }}</h3>
            <h3 class="type-travail">{{ travail.type }}</h3>
            <div class="badges">
                <span class="date-travail">Remise : {{ travail.remise.slice(0, 16) }}</span>
                <span class="disponible">Disponible : {{ travail.disponible }}</span>
            </div>
            <p class="description-travail">{{ travail.description }}</p>
        </section>

        <section class="section-creneaux">
            <h2>Mes disponibilités</h2>
            <p v-if="!travail.ouvert" class="erreur">Ce travail est fermé.</p>

            <form v-else @submit.prevent="enregistrer">
                <ul class="erreurs"><li v-for="m in erreurs" :key="m">{{ m }}</li></ul>
                <p v-if="message" class="succes">{{ message }}</p>

                <div class="champ">
                    <label for="matricule">Matricule</label>
                    <input id="matricule" v-model.trim="matricule" maxlength="20" required>
                </div>
                <div class="champ">
                    <label for="nom">Nom</label>
                    <input id="nom" v-model.trim="nom" maxlength="100" required>
                </div>

                <div class="liste-creneaux">
                    <label class="creneau-option" v-for="c in disponibilites" :key="c.id">
                        <input type="checkbox" :value="c.id" v-model="selection">
                        {{ c.debut.slice(0, 16) }} → {{ c.fin.slice(11, 16) }}
                    </label>
                </div>
                <button type="submit">Enregistrer mes disponibilités</button>
            </form>
        </section>

        <section class="section-top3">
            <h2>Disponibilités</h2>
            <table>
                <tr><th>Créneau</th><th>Disponibles</th><th>Noms</th></tr>
                <tr v-for="c in disponibilites" :key="c.id"
                    :class="{ meilleur: c.nombre > 0 && c.nombre === maximum }">
                    <td>{{ c.debut.slice(0, 16) }} → {{ c.fin.slice(11, 16) }}</td>
                    <td>{{ c.nombre }}</td>
                    <td>{{ c.noms.join(', ') }}</td>
                </tr>
            </table>
        </section>
    </template>
</div>
<?php require __DIR__ . '/includes/pied.php'; ?>
