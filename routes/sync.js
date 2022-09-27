var express = require("express");
const { compileClientWithDependenciesTracked } = require("jade");
var router = express.Router();
var ERRORS = require("../libs/ERRORS");

let onlineController;

router.setOnlineController = (callback) => {
  onlineController = callback;
};

router.post("/sync", async function (req, res, next) {
  if (req?.text == undefined) {
    res.error(ERRORS.NO_DATA, "sync");
    return;
  }

  let result = syncParser(req.text);

  if (result.error != ERRORS.OK) {
    res.error(result.error, "sync_parser", req.text);
    return;
  }

  if (req?.configControl?.apv?.[result?.main_data?.sn] == undefined) {
    res.error(ERRORS.UNKNOWN_SN, "sync_sn", req.text);
    return;
  }

  let isNewData = await req.isKVSUpdated(
    result?.main_data?.sn,
    result?.main_data
  );

  onlineController(result?.main_data?.sn);

  if (isNewData) {
    appendMain(req, result?.main_data);
    sendRawToChannel(req, result?.main_data, req.text);
  }

  updateApv(req, result?.apv_data);
  checkForMessages(req, result?.main_data);
  checkForCharge(req, result?.main_data);

  res.ok(await checkForCmd(req, result?.main_data));
});

let checkForCharge = async (req, data) => {
  if (data.v4 == 1) {
    await req.mysqlConnection
      .asyncQuery(req.mysqlConnection.SQL_BASE.updateChargeInfo, [
        JSON.stringify({ v1: data.v1, lts: new Date().getTime() }),
        data.sn,
      ])
      .then(
        (result) => {},
        (err) => {
          console.log(req.timeLogFormated + ": updateApv: " + err);
        }
      );
  }
};

let syncParser = (income) => {
  // start/SV3.5.1/N217/w:1182/k:1900/r:1449/m:70,57,57,30,818/c:24/Err:0,1/Mes:10/end

  let result = {
    error: ERRORS.BAD_PACKET,
    main_data: {},
    apv_data: {},
  };

  let baseArray = income.split("/");

  // должно получиться 11 элементов такого массива
  // 0 - start
  // 1 - версия + символ запуска аппарата
  // 2 - серийный номер
  // 3 - тип аппарата 0 – стандартный, 1-киров, 2-с бутылочником

  // 3 - количество литров
  // 4 - сумма купюр или off
  // 5 - сумма б/н или off
  // 6 - монеты массив (1, 2, 5, 10, ALL) или off
  // 7 - температура или off
  // 8 - Err, сообщение об ошибке какого-то устройства
  // 9 - Mess - код сообщения
  // 10 - p - стоимость итра p:1.2
  // 11 - n - номер SIM карты n:93081122233
  // 12 - s - качество связи от 0 - 31, s:15
  // 13 - o - оператор o:Tele2
  // 14 - end

  if (baseArray.length != 19) {
    return result;
  }

  if (baseArray[1][0] != "S") {
    result.main_data["FLAG_start"] = false;
    result.apv_data["version"] = baseArray[1];
  } else {
    result.main_data["FLAG_start"] = true;
    result.apv_data["version"] = baseArray[1].substr(1, baseArray[1].length);
  }

  result.main_data["version"] = result.apv_data["version"]; // версия у нас попадает независимо во все таблицы, как это ни странно

  result.main_data["sn"] = baseArray[2];
  result.apv_data["sn"] = baseArray[2];

  result.apv_data["a"] = baseArray[3].split(":")[1];

  result.main_data["w"] = baseArray[4].split(":")[1];

  let __k = baseArray[5].split(":")[1];

  if (__k == "off") {
    result.main_data["k"] = 0;
    result.main_data["FLAG_k_off"] = true;
  } else {
    result.main_data["k"] = __k;
    result.main_data["FLAG_k_off"] = false;
  }

  let __r = baseArray[6].split(":")[1];

  if (__r == "off") {
    result.main_data["r"] = 0;
    result.main_data["FLAG_r_off"] = true;
  } else {
    result.main_data["r"] = __r;
    result.main_data["FLAG_r_off"] = false;
  }

  let __m = baseArray[7].split(":")[1];

  if (__m == "off") {
    result.main_data["m1"] = 0;
    result.main_data["m2"] = 0;
    result.main_data["m5"] = 0;
    result.main_data["m10"] = 0;
    result.main_data["FLAG_error_m1"] = false;
    result.main_data["FLAG_error_m2"] = false;
    result.main_data["FLAG_error_m5"] = false;
    result.main_data["FLAG_error_m10"] = false;
    result.main_data["FLAG_m_off"] = true;
  } else {
    let __mArray = __m.split(",");

    if (__mArray[0] == "Er") {
      result.main_data["m1"] = 0;
      result.main_data["FLAG_error_m1"] = true;
    } else {
      result.main_data["m1"] = __mArray[0];
      result.main_data["FLAG_error_m1"] = false;
    }

    if (__mArray[1] == "Er") {
      result.main_data["m2"] = 0;
      result.main_data["FLAG_error_m2"] = true;
    } else {
      result.main_data["m2"] = __mArray[1];
      result.main_data["FLAG_error_m2"] = false;
    }

    if (__mArray[2] == "Er") {
      result.main_data["m5"] = 0;
      result.main_data["FLAG_error_m5"] = true;
    } else {
      result.main_data["m5"] = __mArray[2];
      result.main_data["FLAG_error_m5"] = false;
    }

    if (__mArray[3] == "Er") {
      result.main_data["m10"] = 0;
      result.main_data["FLAG_error_m10"] = true;
    } else {
      result.main_data["m10"] = __mArray[3];
      result.main_data["FLAG_error_m10"] = false;
    }
    result.main_data["m"] = __mArray[4];
    result.main_data["FLAG_m_off"] = false;
  }

  let __t = baseArray[8].split(":")[1].split(",");
  if (__t[0] == "off") {
    result.main_data["FLAG_t_off"] = true;
    result.main_data["tSOLD"] = 0;
    result.main_data["tREMAIN"] = 0;
  } else {
    result.main_data["FLAG_t_off"] = false;
    result.main_data["tSOLD"] = __t[0];
    result.main_data["tREMAIN"] = __t[1];
  }

  let __c = baseArray[9].split(":")[1];
  if (__c == "off") {
    result.main_data["c"] = 0;
    result.main_data["FLAG_c_off"] = true;
  } else {
    result.main_data["c"] = __c;
    result.main_data["FLAG_c_off"] = false;
  }

  let __ErrArray = baseArray[10].split(":")[1].split(",");
  result.main_data["errorDevice"] = __ErrArray[0];
  result.main_data["errorCode"] = __ErrArray[1];

  result.main_data["messCode"] = baseArray[11].split(":")[1].split(",");

  result.apv_data["cost"] = baseArray[12].split(":")[1];
  result.apv_data["phone"] = baseArray[13].split(":")[1];
  result.apv_data["linkState"] = baseArray[14].split(":")[1];
  result.apv_data["oper"] = baseArray[15].split(":")[1];

  let __v = baseArray[16].split(":")[1].split(",");

  result.main_data["v1"] = __v[0];
  result.main_data["v2"] = __v[1];
  result.main_data["v3"] = __v[2];
  result.main_data["v4"] = __v[3];

  let __dv = baseArray[17].split(":")[1].split(",");
  result.main_data["dv1"] = __dv[0];
  result.main_data["dv2"] = __dv[1];
  result.main_data["dv3"] = __dv[2];
  result.main_data["dv4"] = __dv[3];
  result.main_data["dv5"] = __dv[4];

  result.error = ERRORS.OK;
  return result;
};

let appendMain = async (req, data) => {
  await req.mysqlConnection
    .asyncQuery(req.mysqlConnection.SQL_BASE.appendMain, [
      data.sn,
      data.FLAG_start,
      data.version,
      data.w,
      data.k,
      data.r,
      data.m,
      data.m1,
      data.m2,
      data.m5,
      data.m10,
      data.FLAG_error_m1,
      data.FLAG_error_m2,
      data.FLAG_error_m5,
      data.FLAG_error_m10,
      data.tSOLD,
      data.tREMAIN,
      data.c,
      data.v1,
      data.v2,
      data.v3,
      data.v4,
      data.dv1,
      data.dv2,
      data.dv3,
      data.dv4,
      data.dv5,
      data.errorDevice,
      data.errorCode,
      JSON.stringify(data.messCode),
      data.FLAG_k_off,
      data.FLAG_r_off,
      data.FLAG_m_off,
      data.FLAG_c_off,
      data.FLAG_t_off,
    ])
    .then(
      (result) => {},
      (err) => {
        console.log(req.timeLogFormated + ": appendMain: " + err);
      }
    );
};

let updateApv = async (req, data) => {
  await req.mysqlConnection
    .asyncQuery(req.mysqlConnection.SQL_BASE.updateApv, [
      data.version,
      data.cost,
      data.phone,
      data.linkState,
      data.oper,
      data.a,
      data.sn,
    ])
    .then(
      (result) => {},
      (err) => {
        console.log(req.timeLogFormated + ": updateApv: " + err);
      }
    );
};

let checkForMessages = async (req, data) => {
  let apvConfig = req?.configControl?.apv?.[data.sn];
  let messages = req?.configControl?.messages;
  let devices = req?.configControl?.devices;
  let errors = req?.configControl?.errors;

  data.messCode.forEach((messCode) => {
    if (messages?.[messCode]?.isActive) {
      try {
        req.telegram.sendMessage(
          `@${apvConfig.tgLink}`,
          `${apvConfig.sn} : Сообщение : "${messages[messCode].messText}"`
        );
      } catch (e) {
        console.log(
          req.timeLogFormated +
            ": TELEGRAM_ERROR: " +
            apvConfig.sn +
            " : " +
            e?.response?.description
        );
      }
    }
  });

  if (errors?.[data?.errorCode]?.isActive) {
    try {
      await req.telegram.sendMessage(
        `@${apvConfig.tgLink}`,
        `${apvConfig.sn} : Ошибка : "${
          errors[data.errorCode].errorText
        }" в устройстве : "${devices[data.errorDevice].deviceName}"`
      );
    } catch (e) {
      console.log(
        req.timeLogFormated +
          ": TELEGRAM_ERROR: " +
          apvConfig.sn +
          " : " +
          e?.response?.description
      );
    }
  }
};

let checkForCmd = async (req, data) => {
  let cmd = undefined;
  let cmdProfile = undefined;

  let appendCmds = async () => {
    await req.mysqlConnection
      .asyncQuery(req.mysqlConnection.SQL_BASE.appendCmds, [
        data.sn,
        JSON.stringify(cmdProfile.userData),
        cmdProfile.cmd,
      ])
      .then(
        (result) => {},
        (err) => {
          console.log(req.timeLogFormated + ": appendCmds: " + err);
        }
      );
  };

  let dropCmdProfile = async () => {
    await req.mysqlConnection
      .asyncQuery(req.mysqlConnection.SQL_BASE.dropCmdProfile, ["{}", data.sn])
      .then(
        (result) => {},
        (err) => {
          console.log(req.timeLogFormated + ": dropCmdProfile: " + err);
        }
      );
  };

  await req.mysqlConnection
    .asyncQuery(req.mysqlConnection.SQL_BASE.getCmdProfile, [data.sn])
    .then(
      (result) => {
        if (result.length == 1) {
          cmdProfile = JSON.parse(result[0].cmdProfile);
          if ((cmd = cmdProfile?.cmd || undefined)) {
            appendCmds();
            dropCmdProfile();
          }
        }
      },
      (err) => {
        console.log(req.timeLogFormated + ": getCmdProfile: " + err);
      }
    );

  return cmd;
};

let sendRawToChannel = async (req, data, text) => {
  let apvConfig = req?.configControl?.apv?.[data.sn];

  try {
    await req.telegram.sendMessage(
      `@${apvConfig.tgLink}`,
      `${apvConfig.sn} : RAW : "${text}"`
    );
  } catch (e) {
    console.log(
      req.timeLogFormated +
        ": TELEGRAM_ERROR: " +
        apvConfig.sn +
        " : " +
        e?.response?.description
    );
  }
};

module.exports = router;
