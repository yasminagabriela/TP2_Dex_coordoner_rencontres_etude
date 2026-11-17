import { createApp } from 'https://unpkg.com/vue@3.5.13/dist/vue.esm-browser.prod.js';
import { getCours, getTravaux } from './api.js';

createApp({
    data() {
        return { cours: [], travaux: [], filtre: '', chargement: true, erreur: '' };
    },
    computed: {
        // Groups the travaux by course: [{ titre, travaux: [...] }]
        parCours() {
            const groupes = new Map();
            for (const t of this.travaux) {
                if (!groupes.has(t.cours_titre)) groupes.set(t.cours_titre, []);
                groupes.get(t.cours_titre).push(t);
            }
            return [...groupes].map(([titre, travaux]) => ({ titre, travaux }));
        }
    },
    methods: {
        async chargerTravaux() {
            this.erreur = '';
            try {
                this.travaux = await getTravaux(this.filtre);   // no page reload
            } catch (e) {
                this.erreur = e.message;
            }
        }
    },
    async mounted() {
        try {
            this.cours = await getCours();
            await this.chargerTravaux();
        } catch (e) {
            this.erreur = e.message;
        } finally {
            this.chargement = false;
        }
    }
}).mount('#app-index');