var express = require("express");
var router = express.Router();
var ERRORS = require("../libs/ERRORS");

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

  if (isNewData) {
    appendMain(req, result?.main_data);
  }

  updateApv(req, result?.apv_data);

  res.ok();
});

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

  if (baseArray.length != 16) {
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

  result.main_data["w"] = baseArray[3].split(":")[1];

  let __k = baseArray[4].split(":")[1];

  if (__k == "off") {
    result.main_data["k"] = 0;
    result.main_data["FLAG_k_off"] = true;
  } else {
    result.main_data["k"] = __k;
    result.main_data["FLAG_k_off"] = false;
  }

  let __r = baseArray[5].split(":")[1];

  if (__r == "off") {
    result.main_data["r"] = 0;
    result.main_data["FLAG_r_off"] = true;
  } else {
    result.main_data["r"] = __r;
    result.main_data["FLAG_r_off"] = false;
  }

  let __m = baseArray[6].split(":")[1];

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

  let __c = baseArray[7].split(":")[1];
  if (__c == "off") {
    result.main_data["c"] = 0;
    result.main_data["FLAG_c_off"] = true;
  } else {
    result.main_data["c"] = __c;
    result.main_data["FLAG_c_off"] = false;
  }

  let __ErrArray = baseArray[8].split(":")[1].split(",");
  result.main_data["errDevice"] = __ErrArray[0];
  result.main_data["errCode"] = __ErrArray[1];

  result.main_data["messCode"] = baseArray[9].split(":")[1];

  result.apv_data["cost"] = baseArray[10].split(":")[1];
  result.apv_data["phone"] = baseArray[11].split(":")[1];
  result.apv_data["linkState"] = baseArray[12].split(":")[1];
  result.apv_data["oper"] = baseArray[13].split(":")[1];

  let __v = baseArray[14].split(":")[1].split(",");

  result.main_data["v1"] = __v[0];
  result.main_data["v2"] = __v[1];
  result.main_data["v3"] = __v[2];
  result.main_data["v4"] = __v[3];

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
      data.c,
      data.v1,
      data.v2,
      data.v3,
      data.v4,
      data.errDevice,
      data.errCode,
      data.messCode,
      data.FLAG_k_off,
      data.FLAG_r_off,
      data.FLAG_m_off,
      data.FLAG_c_off,
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
      data.sn,
    ])
    .then(
      (result) => {},
      (err) => {
        console.log(req.timeLogFormated + ": updateApv: " + err);
      }
    );
};

module.exports = router;
