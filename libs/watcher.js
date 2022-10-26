const ts = require("./ts-middle");
const loadMainConfig = require("./loadMainConfig");
const schedule = require("node-schedule");
const config = require("../etc/config");
const { Telegraf } = require("telegraf");

let init = async (config, mysqlConnection) => {
  let token = config.botToken;
  const bot = new Telegraf(token);

  schedule.scheduleJob(config.offlineReminderSheduler, function () {
    offlineReminder(mysqlConnection, bot);
  });

  schedule.scheduleJob("0 * * * *", async function () {
    //schedule.scheduleJob("* * * * *", async function () {
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

  let messages = configControl?.messages;
  let devices = configControl?.devices;
  let errors = configControl?.errors;

  await mysqlConnection
    .asyncQuery(
      mysqlConnection.SQL_BASE.getKVSbySN(
        Object.keys(configControl.apv).filter((sn) => {
          return configControl.apv[sn].tgLink != "";
        })
      ),
      []
    )
    .then(
      (result) => {
        __dataToSend = result;
      },
      (err) => {
        console.log(timeLogFormated + ": reminder: " + err);
      }
    );

  __dataToSend.forEach(async (e) => {
    let onof = (bool) => {
      return bool ? "ON" : "OFF";
    };

    let errok = (bool) => {
      return bool ? "ERROR" : "OK";
    };

    let data = JSON.parse(e.data);

    // data.messCode.forEach((mc) => {
    //   mc = messages[mc];
    // });
    //console.log(data);

    //    let __mesages = data.messCode.join(", ");
    let __messages = "";

    let __text = `${e.sn}: Сводка
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
    Ошибка: ${devices[data.errorDevice].deviceName}:${
      errors[data.errorCode].errorText
    };
    Сообщения: ${__messages};
    V: ${data.v1},${data.v2},${data.v3},${data.v4};
    Dv: ${data.dv1},${data.dv2},${data.dv3},${data.dv4},${data.dv5};
    Бесплатная раздача: ${data.f} л. [${onof(data.FLAG_f_off)}];
    Тара: ${data.tSOLD}/${data.tREMAIN} [${onof(!data.FLAG_t_off)}];`;

    try {
      console.log(e.sn + "+");
      await bot.telegram.sendMessage(
        `@${configControl.apv[e.sn].tgLink}`,
        __text
      );
      console.log(e.sn + "-");
    } catch (err) {
      console.log(
        "TELEGRAM_ERROR: " + e.sn + " : " + err?.response?.description
      );
    }
  });
};

let offlineReminder = async function (mysqlConnection, bot) {
  let configControl = {};
  await loadMainConfig(mysqlConnection(), ts(), configControl);

  Object.keys(configControl.apv)
    .filter((sn) => {
      return (
        configControl.apv[sn].online == false &&
        configControl.apv[sn].tgLink != "" &&
        configControl.Reminder.daylyReminder
      );
    })
    .forEach((sn) => {
      try {
        bot.telegram.sendMessage(
          `@${configControl.apv[sn].tgLink}`,
          `${sn} : Напоминание : Всё ещё нет связи с АПВ`
        );
      } catch (err) {
        console.log(
          "TELEGRAM_ERROR: " + e.sn + " : " + err?.response?.description
        );
      }
    });
};

module.exports.init = init;
