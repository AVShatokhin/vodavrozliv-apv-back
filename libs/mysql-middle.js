module.exports = (config) => {
  const mysql = require("mysql");

  var mysqlConnection = mysql.createConnection({
    host: config.db_host,
    user: config.db_user,
    database: config.db_name,
    password: config.db_password,
  });

  mysqlConnection.connect((err) => {
    let timeLogFormated = () => {
      let n = (i) => {
        s = new String(i);
        if (s.length == 1) return `0${s}`;
        else return s;
      };

      let d = new Date();
      return `${n(d.getDate())}.${n(d.getMonth() + 1)}.${d.getFullYear()} ${n(
        d.getHours()
      )}.${n(d.getMinutes())}.${n(d.getSeconds())}`;
    };

    if (err) {
      console.log(timeLogFormated() + ":" + err);
      throw err;
    }

    mysqlConnection.query("SET time_zone='+3:00';", function (err, result) {
      if (err) {
        throw err;
      } else {
        mysqlConnection.SQL_BASE = require("./SQL_BASE")(config);
        mysqlConnection.asyncQuery = (sql, params) => {
          return new Promise((resolve, reject) => {
            mysqlConnection.query(sql, params, (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
              }
            });
          });
        };
        console.log(timeLogFormated() + ": mysql connected");
      }
    });
  });

  return function (req, res, next) {
    req.mysqlConnection = mysqlConnection;
    next();
  };
};
