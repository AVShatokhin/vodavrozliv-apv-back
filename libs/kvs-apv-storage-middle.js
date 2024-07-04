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
        console.log(req.timeLogFormated + ": KVS: loaded from DB: SN: " + sn);
      }
    };

    req.isKVSUpdated = async (sn, data) => {
      let newDataFlags = { isNewData: false, isNewDispatcherData: false };

      // блок проверки всего пакета данных
      let dataStr = JSON.stringify(data);
      if (!(JSON.stringify(store[sn]) === dataStr)) {
        await req.mysqlConnection
          .asyncQuery(req.mysqlConnection.SQL_BASE.kvsReplace, [sn, dataStr])
          .then(
            (result) => {},
            (err) => {
              console.log(req.timeLogFormated + ": KVS: " + err);
            }
          );
        console.log(req.timeLogFormated + ": KVS: updated: SN: " + sn);
        newDataFlags.isNewData = true;
      }

      let __store = store[sn];

      // блок проверки изменения диспетчерских данных
      if (
        data.dv1 != __store.dv1 ||
        data.dv2 != __store.dv2 ||
        data.dv3 != __store.dv3 ||
        data.dv4 != __store.dv4 ||
        data.v4 != __store.v4 ||
        data.v2 != __store.v2 ||
        data.v1 != __store.v1 ||
        ((data.errorCode != __store.errorCode ||
          data.errorDevice != __store.errorDevice) &&
          (data.errorCode == 3 ||
            data.errorCode == 4 ||
            data.errorCode == 15 ||
            data.errorCode == 18))
      ) {
        // TODO: переход в оффлайн

        console.log(
          req.timeLogFormated + ": KVS: dispatcher data updated: SN: " + sn
        );

        // отдельно фиксируем состояние заправки
        let __chargeObject = {};
        if (data.v4 != __store.v4) {
          if (data.v4 == 1) {
            // заправка начата
            __chargeObject.state = "start";
            __chargeObject.v1 = data.v1;
          } else if (data.v4 == 0) {
            // заправка до полного окончена
            __chargeObject.v1 = data.v1;
            __chargeObject.state = "full";
          } else if (data.v4 == 2) {
            // заправка по переходу к продаже окончена
            __chargeObject.v1 = data.v1;
            __chargeObject.state = "sale";
          } else {
            // ошибка датчика
            __chargeObject.v1 = data.v1;
            __chargeObject.state = "error";
          }
        }

        await req.mysqlConnection
          .asyncQuery(req.mysqlConnection.SQL_BASE.appendDispMain, [
            sn,
            data.w,
            data.v1,
            data.v2,
            data.v3,
            data.v4,
            JSON.stringify(__chargeObject),
            data.dv1,
            data.dv2,
            data.dv3,
            data.dv4,
            data.dv5,
            data.errorDevice,
            data.errorCode,
          ])
          .then(
            (result) => {},
            (err) => {
              console.log(req.timeLogFormated + ": KVS: " + err);
            }
          );

        newDataFlags.isNewDispatcherData = true;
      }

      if (newDataFlags.isNewData) store[sn] = data;
      return newDataFlags;
    };

    next();
  };
};
