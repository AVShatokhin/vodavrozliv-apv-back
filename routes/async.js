var express = require("express");
var router = express.Router();
var ERRORS = require("../libs/ERRORS");

router.post("/async", async function (req, res, next) {
  if (req?.text == undefined) {
    res.error(ERRORS.NO_DATA, "async");
    return;
  }

  let result = asyncParser(req.text);

  if (result.error != ERRORS.OK) {
    res.error(result.error, "async_parser", req.text);
    return;
  }

  if (req?.configControl?.apv?.[result?.inkas_data?.sn] == undefined) {
    res.error(ERRORS.UNKNOWN_SN, "async_sn", req.text);
    return;
  }

  // let isNewData = await req.isKVSUpdated(
  //   result?.main_data?.sn,
  //   result?.main_data
  // );

  // if (isNewData) {
  //   appendMain(req, result?.main_data);
  // }

  // updateApv(req, result?.apv_data);

  checkOp(req, result);
  appendInkas(req, result.inkas_data);

  //console.log(result);

  res.ok();
});

let asyncParser = (income) => {
  //start/V3.5.1/N131/INKAS:4854/kup:2900/rd:2002/box:1954/date:1112310220143/op:00000AA352B7/end

  let result = {
    error: ERRORS.BAD_PACKET,
    inkas_data: {},
  };

  let baseArray = income.split("/");

  // должно получиться 10 элементов такого массива
  // 0 - start
  // 1 - версия + символ запуска аппарата
  // 2 - серийный номер
  // 3 - INKAS сумма проведённой инкассации
  // 4 - kup - сумма купюр
  // 5 - rd - сумма безнал
  // 6 - сумма в рублях в боксе монетника
  // 7 - date мешанина дата время и номер инкассации 1 последняя цифра года(21год), 11 – месяц, 23 – число, 10 - часов, 22 – минуты, 0143 – порядковый номер инкассации.
  // 8 - код электронного ключа инкассатора
  // 9 - end

  if (baseArray.length != 10) {
    return result;
  }

  result.inkas_data["version"] = baseArray[1];
  result.inkas_data["sn"] = baseArray[2];
  result.inkas_data["inkas"] = baseArray[3].split(":")[1];
  result.inkas_data["kup"] = baseArray[4].split(":")[1];
  result.inkas_data["rd"] = baseArray[5].split(":")[1];
  result.inkas_data["box"] = baseArray[6].split(":")[1];

  let __date_hash = baseArray[7].split(":")[1];
  result.inkas_data["date"] = __date_hash.substr(0, 9);
  result.inkas_data["inkas_number"] = __date_hash.substr(9, 4);

  result.inkas_data["op"] = baseArray[8].split(":")[1];

  result.error = ERRORS.OK;
  return result;
};

let checkOp = (req, result) => {
  result.inkas_data["op_extended"] = {};
  result.inkas_data["FLAG_op_failed"] = false;
};

let appendInkas = async (req, data) => {
  await req.mysqlConnection
    .asyncQuery(req.mysqlConnection.SQL_BASE.appendInkas, [
      data.sn,
      data.inkas_number,
      data.date,
      data.version,
      data.inkas,
      data.kup,
      data.box,
      data.op,
      JSON.stringify(data.op_extended),
      data.FLAG_op_failed,
    ])
    .then(
      (result) => {},
      (err) => {
        console.log(req.timeLogFormated + ": appendInkas: " + err);
      }
    );
};

// let updateApv = async (req, data) => {
//   await req.mysqlConnection
//     .asyncQuery(req.mysqlConnection.SQL_BASE.updateApv, [
//       data.version,
//       data.cost,
//       data.phone,
//       data.linkState,
//       data.oper,
//       data.sn,
//     ])
//     .then(
//       (result) => {},
//       (err) => {
//         console.log(req.timeLogFormated + ": updateApv: " + err);
//       }
//     );
// };

module.exports = router;