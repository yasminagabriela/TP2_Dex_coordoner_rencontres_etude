import { createApp } from 'https://unpkg.com/vue@3.5.13/dist/vue.esm-browser.prod.js';
import * as api from './api.js';

// "2026-10-18 23:59:00" → "2026-10-18T23:59" (datetime-local input)
const versChamp = (sql) => sql.replace(' ', 'T').slice(0, 16);

createApp({
    data() {
        return {
            jeton: sessionStorage.getItem('jeton'),
            nom: sessionStorage.getItem('nom') ?? '',
            identifiant: '', motDePasse: '', erreurConnexion: '',
            travaux: [],
            travail: null,                 // travail being edited
            erreursTravail: [], erreursCreneaux: [],
            nouveauCreneau: { debut: '', fin: '' },
            creneauASupprimer: null
        };
    },
    computed: {
        messageSuppression() {
            const nb = this.creneauASupprimer?.nb_reponses ?? 0;
            if (nb === 0) return "Ce créneau n'a aucune réponse. Le supprimer ?";
            if (nb === 1) return 'Ce créneau a 1 réponse. Elle sera supprimée. Continuer ?';
            return `Ce créneau a ${nb} réponses. Elles seront supprimées. Continuer ?`;
        }
    },
    methods: {
        async connecter() {
            this.erreurConnexion = '';
            try {
                const { jeton, nom } = await api.connexion(this.identifiant, this.motDePasse);
                sessionStorage.setItem('jeton', jeton);
                sessionStorage.setItem('nom', nom);
                this.jeton = jeton;
                this.nom = nom;
                this.motDePasse = '';
                await this.chargerTravaux();
            } catch (e) {
                this.erreurConnexion = e.message;
            }
        },
        oublierJeton(message = '') {
            sessionStorage.removeItem('jeton');
            sessionStorage.removeItem('nom');
            this.jeton = null;
            this.travail = null;
            this.travaux = [];
            this.erreurConnexion = message;
        },
        async deconnecter() {
            try { await api.deconnexion(this.jeton); } catch {  }
            this.oublierJeton();
        },
        gererErreur(e, cible) {
            if (e.statut === 401) this.oublierJeton('Votre session a expiré. Reconnectez-vous.');
            else this[cible] = e.erreurs;
        },
        async chargerTravaux() {
            try { this.travaux = await api.getTravauxAdmin(this.jeton); }
            catch (e) { this.gererErreur(e, 'erreursTravail'); }
        },
        preparerCreneaux(creneaux) {
            return creneaux.map(c => ({ ...c, debut: versChamp(c.debut), fin: versChamp(c.fin) }));
        },
        async ouvrirTravail(id) {
            try {
                const t = await api.getTravail(id);
                this.travail = {
                    ...t,
                    ouvert: Boolean(t.ouvert),   
                    remise: versChamp(t.remise),
                    creneaux: this.preparerCreneaux(t.creneaux)
                };
                this.erreursTravail = [];
                this.erreursCreneaux = [];
            } catch (e) { this.gererErreur(e, 'erreursTravail'); }
        },
        // Reloads only the créneaux (keeps unsaved edits in the travail form)
        async rafraichirCreneaux() {
            const t = await api.getTravail(this.travail.id);
            this.travail.creneaux = this.preparerCreneaux(t.creneaux);
            this.erreursCreneaux = [];
        },
        async enregistrerTravail() {
            const { titre, description, type, disponible, remise, ouvert } = this.travail;
            try {
                await api.modifierTravail(this.jeton, this.travail.id,
                    { titre, description, type, disponible, remise, ouvert });
                this.travail = null;
                await this.chargerTravaux();
            } catch (e) { this.gererErreur(e, 'erreursTravail'); }
        },
        async ajouterCreneau() {
            try {
                await api.ajouterCreneau(this.jeton, this.travail.id, this.nouveauCreneau);
                this.nouveauCreneau = { debut: '', fin: '' };
                await this.rafraichirCreneaux();
            } catch (e) { this.gererErreur(e, 'erreursCreneaux'); }
        },
        async enregistrerCreneau(c) {
            try {
                await api.modifierCreneau(this.jeton, c.id, { debut: c.debut, fin: c.fin });
                await this.rafraichirCreneaux();
            } catch (e) { this.gererErreur(e, 'erreursCreneaux'); }
        },
        demanderSuppression(c) {
            this.creneauASupprimer = c;
            this.$refs.dialog.showModal();
        },
        async confirmerSuppression() {
            this.$refs.dialog.close();
            try {
                await api.supprimerCreneau(this.jeton, this.creneauASupprimer.id);
                await this.rafraichirCreneaux();
            } catch (e) { this.gererErreur(e, 'erreursCreneaux'); }
        }
    },
    mounted() {
        if (this.jeton) this.chargerTravaux();
    }
}).mount('#app-admin');