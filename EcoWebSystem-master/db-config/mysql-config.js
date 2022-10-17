const mysql = require('mysql');
// const pool = mysql.createPool({
//   multipleStatements: true,
//   connectTimeout: 60 * 60 * 1000,
//   acquireTimeout: 60 * 60 * 1000,
//   timeout: 60 * 60 * 1000,
//   host: 'keem.com.ua',
//   user: 'Keem_Magistr',
//   password: 'KeEm_MaGiStR2022',
//   database: 'KEEM_Magistr',
//   port: '3306',
// });

const pool = mysql.createPool({
  multipleStatements: true,
  connectTimeout: 60 * 60 * 1000,
  acquireTimeout: 60 * 60 * 1000,
  timeout: 60 * 60 * 1000,
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'KEEM_Magistr_Optimized',
  port: '3306',
});

//database: 'h34471c_Work' главная  "h34471c_KPI_KEEM" второстепенная
module.exports = pool;
