var express = require("express");
var router = express.Router();
var ERRORS = require("../libs/ERRORS");

router.post("/sync", function (req, res, next) {
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
    result.data["S"] = false;
    result.data["version"] = baseArray[1];
  } else {
    result.data["S"] = true;
    result.data["version"] = baseArray[1].substr(1, baseArray[1].length);
  }

  result.data["sn"] = baseArray[2];
  result.data["w"] = baseArray[3].split(":")[1];

  let __k = baseArray[4].split(":")[1];

  if (__k == "off") {
    result.data["k"] = "off";
  } else {
    result.data["k"] = __k;
  }

  let __r = baseArray[5].split(":")[1];

  if (__r == "off") {
    result.data["r"] = "off";
  } else {
    result.data["r"] = __r;
  }

  let __m = baseArray[6].split(":")[1];

  if (__m == "off") {
    result.data["m1"] = 0;
    result.data["m2"] = 0;
    result.data["m5"] = 0;

    result.data["m10"] = 0;
    result.data["m"] = "off";
  } else {
    let __mArray = __m.split(",");
    result.data["m1"] = __mArray[0];
    result.data["m2"] = __mArray[1];
    result.data["m5"] = __mArray[2];
    result.data["m10"] = __mArray[3];
    result.data["m"] = __mArray[4];
  }

  let __c = baseArray[7].split(":")[1];
  if (__c == "off") {
    result.data["c"] = "off";
  } else {
    result.data["c"] = __c;
  }

  let __ErrArray = baseArray[8].split(":")[1].split(",");
  result.data["errDevice"] = __ErrArray[0];
  result.data["errCode"] = __ErrArray[1];

  result.data["messCode"] = baseArray[9].split(":")[1];

  result.error = ERRORS.OK;
  return result;
};

module.exports = router;
