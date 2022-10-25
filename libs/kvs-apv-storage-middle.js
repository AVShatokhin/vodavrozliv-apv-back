module.exports = () => {
  let store = {};

  return (req, res, next) => {
    req.apvStore = store;

    req.LoadKVS = async (sn) => {
      if (!store[sn]) {
        await req.mysqlConnection
          .asyncQuery(req.mysqlConnection.SQL_BASE.kvsGet, [sn])
          .then(
            (result) => {
              if (result.length == 0) {
                store[sn] = {};
              } else {
                store[sn] = JSON.parse(result[0].value);
              }
            },
            (err) => {
              store[sn] = {};
              console.log(req.timeLogFormated + ": KVS: " + err);
            }
          );
        console.log(req.timeLogFormated + ": KVS: loaded from DB SN: " + sn);
      }
    };

    req.isKVSUpdated = async (sn, data) => {
      let dataStr = JSON.stringify(data);
      if (!(JSON.stringify(store[sn]) === dataStr)) {
        store[sn] = data;
        await req.mysqlConnection
          .asyncQuery(req.mysqlConnection.SQL_BASE.kvsReplace, [sn, dataStr])
          .then(
            (result) => {},
            (err) => {
              console.log(req.timeLogFormated + ": KVS: " + err);
            }
          );
        console.log(req.timeLogFormated + ": KVS: updated SN: " + sn);
        return true;
      }
      return false;
    };

    next();
  };
};
