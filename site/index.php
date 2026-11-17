<?php
$titrePage  = 'Dex — Accueil';
$scriptPage = 'js/index.js';
require __DIR__ . '/includes/entete.php';
?>
<div id="app-index" class="verticalComposition" v-cloak>
    <h1 class="titre-page">Travaux ouverts</h1>

    <div class="filtre">
        <label for="cours">Cours</label>
        <select id="cours" v-model="filtre" @change="chargerTravaux">
            <option value="">Tous les cours</option>
            <option v-for="c in cours" :key="c.id" :value="c.id">{{ c.titre }}</option>
        </select>
    </div>

    <p v-if="erreur" class="erreur">{{ erreur }}</p>
    <p v-else-if="!chargement && travaux.length === 0">Aucun travail ouvert pour ce cours.</p>

    <div class="card-cours">
        <template v-for="groupe in parCours" :key="groupe.titre">
            <h2 class="titre-cours">{{ groupe.titre }}</h2>
            <div class="travaux" v-for="t in groupe.travaux" :key="t.id">
                <h3 class="titre-travail">{{ t.titre }}</h3>
                <div class="badges">
                    <span class="type-travail">{{ t.type }}</span>
                    <span class="disponible">Disponible : {{ t.disponible }}</span>
                    <span class="date-travail">Remise : {{ t.remise.slice(0, 16) }}</span>
                </div>
                <p class="description-travail">{{ t.description }}</p>
                <a :href="'travail.php?travail=' + encodeURIComponent(t.id)">Voir le travail</a>
            </div>
        </template>
    </div>
</div>
<?php require __DIR__ . '/includes/pied.php'; ?>
