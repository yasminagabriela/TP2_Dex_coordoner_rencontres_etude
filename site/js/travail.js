import { createApp } from 'https://unpkg.com/vue@3.5.13/dist/vue.esm-browser.prod.js';
import { getTravail, getDisponibilites, enregistrerDisponibilites } from './api.js';

const CLE_ETUDIANT = 'dex-etudiant';
const racine = document.getElementById('app-travail');
const travailId = racine.dataset.travailId;   // passed by PHP (data-travail-id)

// localStorage can throw (private browsing): read and write it carefully
function lireEtudiant() {
    try { return JSON.parse(localStorage.getItem(CLE_ETUDIANT)) ?? {}; }
    catch { return {}; }
}
function sauverEtudiant(matricule, nom) {
    try { localStorage.setItem(CLE_ETUDIANT, JSON.stringify({ matricule, nom })); }
    catch { /* not saved, but the page still works */ }
}

createApp({
    data() {
        const etudiant = lireEtudiant();
        return {
            travail: null,
            disponibilites: [],
            matricule: etudiant.matricule ?? '',   // prefilled
            nom: etudiant.nom ?? '',
            selection: [],
            erreurs: [],
            erreur: '',
            message: ''
        };
    },
    computed: {
        maximum() {
            return Math.max(0, ...this.disponibilites.map(c => c.nombre));
        }
    },
    methods: {
        async chargerDisponibilites() {
            this.disponibilites = await getDisponibilites(travailId, this.matricule);
            // Ticks the créneaux this matricule already chose
            this.selection = this.disponibilites.filter(c => c.choisi).map(c => c.id);
        },
        async enregistrer() {
            this.erreurs = [];
            this.message = '';
            try {
                await enregistrerDisponibilites(travailId, this.matricule, this.nom, this.selection);
                sauverEtudiant(this.matricule, this.nom);   // only after a successful save
                await this.chargerDisponibilites();          // refresh the table, no reload
                this.message = 'Vos disponibilités ont été enregistrées.';
            } catch (e) {
                this.erreurs = e.erreurs;   // 400 or 409 messages from the API
            }
        }
    },
    async mounted() {
        try {
            this.travail = await getTravail(travailId);
            await this.chargerDisponibilites();
            document.title = `Dex — ${this.travail.titre}`;
        } catch (e) {
            this.erreur = e.statut === 404 ? 'Ce travail est introuvable.' : e.message;
        }
    }
}).mount('#app-travail');