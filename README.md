# TP2_Dex_coordoner_rencontres_etude
Dex aide les étudiants à coordonner leurs rencontres d’équipe : chacun coche ses disponibilités pour un travail et l’app met en évidence les meilleurs créneaux. Architecture en trois couches : API Express (Node.js), site PHP (cadre et routage) et interface Vue.js. Inclut une page d’administration protégée pour l’enseignant.


Au TP1, nous avons construit Dex sous forme d’application PHP classique, avec un rendu purement coté serveur : chaque clic rechargeait une page entièrement construite par le serveur.

Ce deuxième travail pratique (TP) reprend le même outil, mais répartit le travail entre trois parties :

une API construite avec Express (Node.js). Elle est la seule couche qui communique avec la base de données ;
un site PHP qui fournit le cadre commun des pages (en-tête, pied de page) et le routage ;
une interface Vue.js qui affiche les données et gère les interactions utilisateur. C’est elle qui communique avec l’API.
Dans ce travail, nous ajoutons également une page d’administration protégée : elle permet à l’enseignant de se connecter pour modifier un travail et ses créneaux.
