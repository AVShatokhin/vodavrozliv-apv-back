let loadMainConfig = require("./loadMainConfig");

module.exports = (config, configControl) => {
  let config_TTLms = config.configTTL * 1000 || 120000;
  let lastTS = 0;

  return async function (req, res, next) {
    if (lastTS < req.timestamp - config_TTLms) {
      await loadMainConfig(
        req.mysqlConnection,
        req.timeLogFormated,
        configControl
      );

      console.log(req.timeLogFormated + ": Load config from DB");
      lastTS = req.timestamp;
    }
    req.configControl = configControl;
    next();
  };
};
