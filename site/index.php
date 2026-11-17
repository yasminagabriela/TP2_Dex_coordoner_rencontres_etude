<?php
$titrePage  = 'Dex — Accueil';
$scriptPage = 'js/index.js';
require __DIR__ . '/includes/entete.php';
?>
<div id="app-index" class="verticalComposition" v-cloak>
    <label for="cours">Cours</label>
    <select id="cours" v-model="filtre" @change="chargerTravaux">
        <option value="">Tous les cours</option>
        <option v-for="c in cours" :key="c.id" :value="c.id">{{ c.titre }}</option>
    </select>

    <p v-if="erreur" class="erreur">{{ erreur }}</p>
    <p v-else-if="!chargement && travaux.length === 0">Aucun travail ouvert pour ce cours.</p>

    <div class="card-cours">
        <template v-for="groupe in parCours" :key="groupe.titre">
            <h2 class="titre-cours">{{ groupe.titre }}</h2>
            <div class="travaux" v-for="t in groupe.travaux" :key="t.id">
                <h2 class="titre-travail">{{ t.titre }}</h2>
                <h3 class="type-travail">{{ t.type }}</h3>
                <p class="description-travail">{{ t.description }}</p>
                <div class="badges">
                    <span class="date-travail">Remise : {{ t.remise.slice(0, 16) }}</span>
                    <span class="disponible">Disponible : {{ t.disponible }}</span>
                </div>
                <a :href="'travail.php?travail=' + encodeURIComponent(t.id)">Voir le travail</a>
            </div>
        </template>
    </div>
</div>
<?php require __DIR__ . '/includes/pied.php'; ?>
