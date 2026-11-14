import mysql from 'mysql2/promise';

/* je ne suis pas sûre ce qu'est un pool mais
j'ai rechercher avec des ressources comment connecter
mon API à mySQL */

/* apparament, un pool est comme mon $pdo
mais il peut avoir plusieurs requêtes en même
temps!!
*/

const pool = mysql.createPool({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'DexAppBD',
    charset : 'utf8mb4'
});


export default pool;