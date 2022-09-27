const ts = require("./ts-middle");
const loadMainConfig = require("./loadMainConfig");
const schedule = require("node-schedule");
const config = require("../etc/config");

let init = async (config, mysqlConnection) => {
  schedule.scheduleJob(config.daylyStatisticSheduler, function () {
    daylyStatistic(mysqlConnection(), ts());
  });
};

let daylyStatistic = async (mysqlConnection, timeLogFormated) => {
  let stats = await mysqlConnection
    .asyncQuery(mysqlConnection.SQL_BASE.getAPVsnList, [])
    .then(
      (result) => {
        let __stats = {};
        result.forEach((r) => {
          __stats[r.sn] = { daylySellValue: 0 };
        });
        return __stats;
      },
      (err) => {
        console.log(timeLogFormated + ": precalc-stats: " + err);
      }
    );

  let data = await mysqlConnection
    .asyncQuery(mysqlConnection.SQL_BASE.getAllMainLastDay, [])
    .then(
      (result) => {
        return result;
      },
      (err) => {
        console.log(timeLogFormated + ": precalc-stats: " + err);
      }
    );

  let __v2prev = {};
  let date;

  data.forEach((d) => {
    if (stats?.[d.sn] == null) return;
    if (__v2prev?.[d.sn] == null) __v2prev[d.sn] = d.v2;
    if (d.v2 < __v2prev[d.sn]) __v2prev[d.sn] = d.v2;

    let __delta = d.v2 - __v2prev[d.sn];
    stats[d.sn].daylySellValue += __delta;
    __v2prev[d.sn] = d.v2;

    if (date == undefined) date = d.lts;
  });

  Object.keys(stats).forEach((s) => {
    mysqlConnection
      .asyncQuery(mysqlConnection.SQL_BASE.replaceStats, [
        stats[s].daylySellValue,
        s,
        date,
      ])
      .then(
        (result) => {
          return result;
        },
        (err) => {
          console.log(timeLogFormated + ": precalc-stats: " + err);
        }
      );
  });
};

module.exports.init = init;
