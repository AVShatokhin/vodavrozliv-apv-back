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

  if (req?.configControl?.apv?.[result?.data?.sn] == undefined) {
    res.error(ERRORS.UNKNOWN_SN, "sync_sn", req.text);
    return;
  }

  let isNewData = await req.isKVSUpdated(result?.data?.sn, result?.data);

  if (isNewData) {
    appendMain(req, result?.data);
  }

  res.ok();
});

let syncParser = (income) => {
  // start/SV3.5.1/N217/w:1182/k:1900/r:1449/m:70,57,57,30,818/c:24/Err:0,1/Mes:10/end

  let result = {
    error: ERRORS.BAD_PACKET,
    data: {},
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
  // 10 - end

  if (baseArray.length != 11) {
    return result;
  }

  if (baseArray[1][0] != "S") {
    result.data["FLAG_start"] = false;
    result.data["version"] = baseArray[1];
  } else {
    result.data["FLAG_start"] = true;
    result.data["version"] = baseArray[1].substr(1, baseArray[1].length);
  }

  result.data["sn"] = baseArray[2];
  result.data["w"] = baseArray[3].split(":")[1];

  let __k = baseArray[4].split(":")[1];

  if (__k == "off") {
    result.data["k"] = 0;
    result.data["FLAG_k_off"] = true;
  } else {
    result.data["k"] = __k;
    result.data["FLAG_k_off"] = false;
  }

  let __r = baseArray[5].split(":")[1];

  if (__r == "off") {
    result.data["r"] = 0;
    result.data["FLAG_r_off"] = true;
  } else {
    result.data["r"] = __r;
    result.data["FLAG_r_off"] = false;
  }

  let __m = baseArray[6].split(":")[1];

  if (__m == "off") {
    result.data["m1"] = 0;
    result.data["m2"] = 0;
    result.data["m5"] = 0;

    result.data["m10"] = 0;
    result.data["FLAG_m_off"] = true;
  } else {
    let __mArray = __m.split(",");
    result.data["m1"] = __mArray[0];
    result.data["m2"] = __mArray[1];
    result.data["m5"] = __mArray[2];
    result.data["m10"] = __mArray[3];
    result.data["m"] = __mArray[4];
    result.data["FLAG_m_off"] = false;
  }

  let __c = baseArray[7].split(":")[1];
  if (__c == "off") {
    result.data["c"] = 0;
    result.data["FLAG_c_off"] = true;
  } else {
    result.data["c"] = __c;
    result.data["FLAG_c_off"] = false;
  }

  let __ErrArray = baseArray[8].split(":")[1].split(",");
  result.data["errDevice"] = __ErrArray[0];
  result.data["errCode"] = __ErrArray[1];

  result.data["messCode"] = baseArray[9].split(":")[1];

  result.error = ERRORS.OK;
  return result;
};

let appendMain = async (req, data) => {
  await req.mysqlConnection
    .asyncQuery(req.mysqlConnection.SQL_BASE.appendMain, [
      data.sn,
      data.FLAG_start,
      data.w,
      data.k,
      data.r,
      data.m,
      data.m1,
      data.m2,
      data.m5,
      data.m10,
      data.c,
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

module.exports = router;
