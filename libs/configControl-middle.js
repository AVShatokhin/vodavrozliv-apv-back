module.exports = (config) => {
  let config_TTLms = config.configTTL * 1000 || 120000;
  let lastTS = 0;
  let configControl = {};

  return async function (req, res, next) {
    if (lastTS < req.timestamp - config_TTLms) {
      let apv = {};
      await req.mysqlConnection
        .asyncQuery(req.mysqlConnection.SQL_BASE.getAPVconfig, [])
        .then(
          (result) => {
            result.forEach((e) => {
              apv[e.sn] = { address: e.address };
            });
            configControl["apv"] = apv;
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
