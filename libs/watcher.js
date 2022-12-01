const ts = require("./ts-middle");
const loadMainConfig = require("./loadMainConfig");
const schedule = require("node-schedule");
const config = require("../etc/config");
const { Telegraf } = require("telegraf");

let message = (e, configControl) => {
  let onof = (bool) => {
    return bool ? "ON" : "OFF";
  };

  let errok = (bool) => {
    return bool ? "ERROR" : "OK";
  };
  let __messages = configControl?.messages;
  let __devices = configControl?.devices;
  let __errors = configControl?.errors;

  let data = JSON.parse(e.data);
  let messages = [];

  data.messCode.forEach((mc) => {
    messages.push(__messages?.[mc]?.messText || "Неизвестное сообщение");
  });

  return `${e.sn}: Сводка
  Версия: ${data.version};
  Продал: ${data.w} л.;
  Купюрник: ${data.k} [${onof(!data.FLAG_k_off)}];
  Монетник: ${data.m} [${onof(!data.FLAG_m_off)}];
  Безнал: ${data.r} [${onof(!data.FLAG_r_off)}];
  Тубы: 1:${data.m1}:[${errok(data.FLAG_error_m1)}], 2:${data.m2}:[${errok(
    data.FLAG_error_m2
  )}], 5:${data.m5}:[${errok(data.FLAG_error_m5)}], 10:${data.m10}:[${errok(
    data.FLAG_error_m10
  )}];
  Температура: ${data.c} °C [${onof(!data.FLAG_c_off)}];
  Ошибка: ${
    __devices?.[data.errorDevice]?.deviceName || "Неизвестное устройство"
  }:${__errors?.[data.errorCode]?.errorText || "Неизвестная ошибка"};
  Сообщения: ${messages.join(", ")};
  V: ${data.v1},${data.v2},${data.v3},${data.v4};
  Dv: ${data.dv1},${data.dv2},${data.dv3},${data.dv4},${data.dv5};
  Бесплатная раздача: ${data.f} л. [${onof(data.FLAG_f_off)}];
  Тара: ${data.tSOLD}/${data.tREMAIN} [${onof(!data.FLAG_t_off)}];`;
};

let recurcyMain = (i, dataToSend, bot, configControl) => {
  let __i = i;
  if (__i < dataToSend.length) {
    let e = dataToSend[i];
    bot.telegram
      .sendMessage(
        `${configControl.apv[e.sn].tgLink}`,
        message(e, configControl)
      )
      .then(() => {
        recurcyMain(__i + 1, dataToSend, bot, configControl);
      })
      .catch((err) => {
        console.log(
          "TELEGRAM_ERROR: " + e.sn + " : " + err?.response?.description
        );
        recurcyMain(__i + 1, dataToSend, bot, configControl);
      });
  }
};

let init = async (config, mysqlConnection) => {
  let token = config.botToken;
  const bot = new Telegraf(token);

  schedule.scheduleJob(config.offlineReminderSheduler, function () {
    offlineReminder(mysqlConnection, bot);
  });

  schedule.scheduleJob("0 * * * *", async function () {
    let configControl = {};
    await loadMainConfig(mysqlConnection(), ts(), configControl);

    if (checkHour(configControl)) {
      apvResend(mysqlConnection(), bot, configControl, ts());
    }
  });
};

let checkHour = function (configControl) {
  let period =
    configControl?.Reminder?.apvRemindPeriodValue == null
      ? 0
      : configControl.Reminder.apvRemindPeriodValue;
  if (period == 0) {
    return false;
  }
  return new Date().getUTCHours() % period == 0;
};

let apvResend = async function (
  mysqlConnection,
  bot,
  configControl,
  timeLogFormated
) {
  let __dataToSend = [];
  __dataToSend = await mysqlConnection
    .asyncQuery(
      mysqlConnection.SQL_BASE.getKVSbySN(
        Object.keys(configControl.apv).filter((sn) => {
          return (
            configControl.apv[sn].tgLink != "" && configControl.apv[sn].online
          );
        })
      ),
      []
    )
    .then(
      (result) => {
        return result;
      },
      (err) => {
        console.log(timeLogFormated + ": reminder: " + err);
      }
    );

  recurcyMain(0, __dataToSend, bot, configControl);
};

let recurcyOffline = (i, offlineSn, bot, configControl) => {
  let __i = i;
  if (__i < offlineSn.length) {
    let sn = offlineSn[i];
    bot.telegram
      .sendMessage(
        `${configControl.apv[sn].tgLink}`,
        `${sn} : Напоминание : Всё ещё нет связи с АПВ`
      )
      .then(() => {
        recurcyOffline(__i + 1, offlineSn, bot, configControl);
      })
      .catch((err) => {
        console.log(
          "TELEGRAM_ERROR: " + sn + " : " + err?.response?.description
        );
        recurcyOffline(__i + 1, offlineSn, bot, configControl);
      });
  }
};

let offlineReminder = async function (mysqlConnection, bot) {
  let configControl = {};
  await loadMainConfig(mysqlConnection(), ts(), configControl);

  recurcyOffline(
    0,
    Object.keys(configControl.apv).filter((sn) => {
      return (
        configControl.apv[sn].online == false &&
        configControl.apv[sn].tgLink != "" &&
        configControl.Reminder.daylyReminder
      );
    }),
    bot,
    configControl
  );
};

module.exports.init = init;
