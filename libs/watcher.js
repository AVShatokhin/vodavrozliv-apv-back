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

  __dataToSend.forEach((e) => {
    try {
      bot.telegram.sendMessage(
        `@${configControl.apv[e.sn].tgLink}`,
        `${e.sn} : Дублирую информацию : ${e.data}`
      );
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
