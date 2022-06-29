module.exports = (config) => {
  let config_TTLms = config.configTTL * 1000 || 120000;
  let lastTS = 0;
  let configControl = {};

  return async function (req, res, next) {
    if (lastTS < req.timestamp - config_TTLms) {
      await req.mysqlConnection
        .asyncQuery(req.mysqlConnection.SQL_BASE.getAPVconfig, [])
        .then(
          (result) => {
            let __temp = {};
            result.forEach((e) => {
              __temp[e.sn] = e;
            });
            configControl["apv"] = __temp;
          },
          (err) => {
            console.log(req.timeLogFormated + ": configControl: " + err);
          }
        );

      await req.mysqlConnection
        .asyncQuery(req.mysqlConnection.SQL_BASE.getKrugConfig, [])
        .then(
          (result) => {
            let __temp = {};
            result.forEach((e) => {
              __temp[e.krug_id] = e;
            });
            configControl["krug"] = __temp;
          },
          (err) => {
            console.log(req.timeLogFormated + ": configControl: " + err);
          }
        );

      await req.mysqlConnection
        .asyncQuery(req.mysqlConnection.SQL_BASE.getBrigConfig, [])
        .then(
          (result) => {
            let __temp = {};
            result.forEach((e) => {
              e.brigMembers = JSON.parse(e.brigMembers);
              __temp[e.brig_id] = e;
            });
            configControl["brig"] = __temp;
          },
          (err) => {
            console.log(req.timeLogFormated + ": configControl: " + err);
          }
        );

      await req.mysqlConnection
        .asyncQuery(req.mysqlConnection.SQL_BASE.getEngConfig, ["ENGINEER"])
        .then(
          (result) => {
            let __temp = {};
            result.forEach((e) => {
              e.extended = JSON.parse(e.extended);
              __temp[e.uid] = e;
            });
            configControl["eng"] = __temp;
          },
          (err) => {
            console.log(req.timeLogFormated + ": configControl: " + err);
          }
        );

      await req.mysqlConnection
        .asyncQuery(req.mysqlConnection.SQL_BASE.getErrors, [])
        .then(
          (result) => {
            let __temp = {};
            result.forEach((e) => {
              __temp[e.errorCode] = e;
            });
            configControl["errors"] = __temp;
          },
          (err) => {
            console.log(req.timeLogFormated + ": configControl: " + err);
          }
        );

      await req.mysqlConnection
        .asyncQuery(req.mysqlConnection.SQL_BASE.getDevices, [])
        .then(
          (result) => {
            let __temp = {};
            result.forEach((e) => {
              __temp[e.errorDevice] = e;
            });
            configControl["devices"] = __temp;
          },
          (err) => {
            console.log(req.timeLogFormated + ": configControl: " + err);
          }
        );

      await req.mysqlConnection
        .asyncQuery(req.mysqlConnection.SQL_BASE.getMessages, [])
        .then(
          (result) => {
            let __temp = {};
            result.forEach((e) => {
              __temp[e.messCode] = e;
            });
            configControl["messages"] = __temp;
          },
          (err) => {
            console.log(req.timeLogFormated + ": configControl: " + err);
          }
        );

      console.log(req.timeLogFormated + ": Load config from DB");

      lastTS = req.timestamp;
    }
    req.configControl = configControl;
    next();
  };
};
