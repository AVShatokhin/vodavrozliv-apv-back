let loadMainConfig = async (
  mysqlConnection,
  timeLogFormated,
  configControl
) => {
  await mysqlConnection
    .asyncQuery(mysqlConnection.SQL_BASE.getAPVconfig, [])
    .then(
      (result) => {
        let __temp = {};
        result.forEach((e) => {
          __temp[e.sn] = e;
          __temp[e.sn].online = e.online == 1;
        });
        configControl["apv"] = __temp;
      },
      (err) => {
        console.log(timeLogFormated + ": configControl: " + err);
      }
    );

  await mysqlConnection
    .asyncQuery(mysqlConnection.SQL_BASE.getKrugConfig, [])
    .then(
      (result) => {
        let __temp = {};
        result.forEach((e) => {
          __temp[e.krug_id] = e;
        });
        configControl["krug"] = __temp;
      },
      (err) => {
        console.log(timeLogFormated + ": configControl: " + err);
      }
    );

  await mysqlConnection
    .asyncQuery(mysqlConnection.SQL_BASE.getBrigConfig, [])
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
        console.log(timeLogFormated + ": configControl: " + err);
      }
    );

  await mysqlConnection
    .asyncQuery(mysqlConnection.SQL_BASE.getEngConfig, ["ENGINEER"])
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
        console.log(timeLogFormated + ": configControl: " + err);
      }
    );

  await mysqlConnection.asyncQuery(mysqlConnection.SQL_BASE.getErrors, []).then(
    (result) => {
      let __temp = {};
      result.forEach((e) => {
        __temp[e.errorCode] = e;
      });
      configControl["errors"] = __temp;
    },
    (err) => {
      console.log(timeLogFormated + ": configControl: " + err);
    }
  );

  await mysqlConnection
    .asyncQuery(mysqlConnection.SQL_BASE.getDevices, [])
    .then(
      (result) => {
        let __temp = {};
        result.forEach((e) => {
          __temp[e.errorDevice] = e;
        });
        configControl["devices"] = __temp;
      },
      (err) => {
        console.log(timeLogFormated + ": configControl: " + err);
      }
    );

  await mysqlConnection
    .asyncQuery(mysqlConnection.SQL_BASE.getMessages, [])
    .then(
      (result) => {
        let __temp = {};
        result.forEach((e) => {
          __temp[e.messCode] = e;
        });
        configControl["messages"] = __temp;
      },
      (err) => {
        console.log(timeLogFormated + ": configControl: " + err);
      }
    );

  await mysqlConnection
    .asyncQuery(mysqlConnection.SQL_BASE.getReminder, ["Reminder"])
    .then(
      (result) => {
        if (result.length == 0) {
          configControl["Reminder"] = {
            daylyReminder: true,
            apvRemindPeriodValue: 0,
          };
        } else {
          configControl["Reminder"] = JSON.parse(result[0].value);
        }
      },
      (err) => {
        console.log(timeLogFormated + ": configControl: " + err);
      }
    );
};

module.exports = loadMainConfig;
