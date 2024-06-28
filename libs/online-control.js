const { Telegraf } = require("telegraf");
let loadMainConfig = require("./loadMainConfig");

module.exports = (config, configControl) => {
  let mysqlConnection;
  let token = config.botToken;
  let onlines = {};
  const bot = new Telegraf(token);

  let checkLoop = () => {
    setInterval(async () => {
      let __offlines = await mysqlConnection
        .asyncQuery(mysqlConnection.SQL_BASE.getOfflineApvs, [config.sync_TTL])
        .then(
          (result) => {
            return result;
          },
          (err) => {
            console.log("onlineControl: " + err);
            return undefined;
          }
        );

      if (!__offlines?.length > 0) return;

      mysqlConnection
        .asyncQuery(
          mysqlConnection.SQL_BASE.setOfflineApvs(
            Array.from(__offlines, (x) => {
              return x.sn;
            })
          ),
          []
        )
        .then(
          (result) => {},
          (err) => {
            console.log("onlineControl: setOfflineApvs: " + err);
          }
        );

      __offlines.forEach((e) => {
        // записываем в журналы данные о переходе в офлайн
        mysqlConnection
          .asyncQuery(mysqlConnection.SQL_BASE.insertErrorStats, [
            e.sn,
            config.sync_offlineCode,
            config.sync_LinkDevice,
            true,
          ])
          .then(
            (result) => {},
            (err) => {
              console.log("OnlineController : insertErrorStats: " + err);
            }
          );

        onlines[e.sn] = 0;
        console.log(e.sn + ": offline");

        mysqlConnection
          .asyncQuery(mysqlConnection.SQL_BASE.appendMainOnlineOffline, [
            e.sn,
            config.sync_LinkDevice,
            config.sync_offlineCode,
          ])
          .then(
            (result) => {},
            (err) => {
              console.log("onlineControl: " + err);
            }
          );

        // записываем в журнал диспетчера
        mysqlConnection
          .asyncQuery(mysqlConnection.SQL_BASE.appendDispMain, [
            e.sn,
            0,
            0,
            0,
            0,
            0,
            "{}",
            0,
            0,
            0,
            0,
            0,
            config.sync_LinkDevice,
            config.sync_offlineCode,
          ])
          .then(
            (result) => {},
            (err) => {
              console.log("onlineControl : dispatcher: " + err);
            }
          );

        if (
          e?.tgLink &&
          configControl.errors[config.sync_offlineCode]?.isActive
        ) {
          try {
            bot.telegram.sendMessage(
              `${e.tgLink}`,
              `${e.sn} : Сообщение : Пропала связь`
            );
          } catch (err) {
            console.log(
              "TELEGRAM_ERROR: " + e.sn + " : " + err?.response?.description
            );
          }
        }
      });
    }, config.sync_CheckPeriod * 1000);
  };

  let initOnlines = async () => {
    return await mysqlConnection
      .asyncQuery(mysqlConnection.SQL_BASE.getOnlineApvs, [])
      .then(
        (result) => {
          return Object.fromEntries(
            Array.from(result, (r) => {
              return [r.sn, r.online];
            })
          );
        },
        (err) => {
          console.log("onlineControl: " + err);
          return {};
        }
      );
  };

  return {
    callback: (sn) => {
      if (onlines[sn]) return;
      onlines[sn] = 1;
      console.log(sn + ": online");

      // записываем в статистику ошибок выход из офлайна
      mysqlConnection
        .asyncQuery(mysqlConnection.SQL_BASE.insertErrorStats, [
          sn,
          config.sync_offlineCode,
          config.sync_LinkDevice,
          false,
        ])
        .then(
          (result) => {},
          (err) => {
            console.log("OnlineController : insertErrorStats: " + err);
          }
        );

      mysqlConnection
        .asyncQuery(mysqlConnection.SQL_BASE.appendMainOnlineOffline, [
          sn,
          config.sync_LinkDevice,
          config.sync_onlineCode,
        ])
        .then(
          (result) => {},
          (err) => {
            console.log("onlineControl: " + err);
          }
        );

      // записываем в журнал диспетчера
      mysqlConnection
        .asyncQuery(mysqlConnection.SQL_BASE.appendDispMain, [
          sn,
          0,
          0,
          0,
          0,
          0,
          "{}",
          0,
          0,
          0,
          0,
          0,
          config.sync_LinkDevice,
          config.sync_onlineCode,
        ])
        .then(
          (result) => {},
          (err) => {
            console.log("onlineControl : dispatcher: " + err);
          }
        );

      let __tgLink = configControl.apv[sn]?.tgLink;
      if (__tgLink && configControl.errors[config.sync_onlineCode]?.isActive) {
        try {
          bot.telegram.sendMessage(
            `${__tgLink}`,
            `${sn} : Сообщение : Появилась связь`
          );
        } catch (err) {
          console.log(
            "TELEGRAM_ERROR: " + sn + " : " + err?.response?.description
          );
        }
      }
    },
    init: async (mysql) => {
      mysqlConnection = mysql;
      onlines = await initOnlines();
      await loadMainConfig(mysqlConnection, "onlineController", configControl);
      console.log("Load config from DB");
      checkLoop();
    },
  };
};
