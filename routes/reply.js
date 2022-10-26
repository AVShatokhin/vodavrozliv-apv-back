var express = require("express");
const { compileClientWithDependenciesTracked } = require("jade");
var router = express.Router();
var ERRORS = require("../libs/ERRORS");

let onlineController;

router.setOnlineController = (callback) => {
  onlineController = callback;
};

router.post("/reply", async function (req, res, next) {
  if (req?.text == undefined) {
    res.error(ERRORS.NO_DATA, "sync");
    return;
  }

  let result = replyParser(req.text);

  if (result.error != ERRORS.OK) {
    res.error(result.error, "reply_parser", req.text);
    return;
  }

  if (req?.configControl?.apv?.[result?.main_data?.sn] == undefined) {
    res.error(ERRORS.UNKNOWN_SN, "reply_sn", req.text);
    return;
  }

  sendReplyToChannel(req, result?.main_data);

  res.ok();
});

let replyParser = (income) => {
  // start/info/V3.5.1/N111/Test texzt Reply !!! sdfsdf/end

  let result = {
    error: ERRORS.BAD_PACKET,
    main_data: {},
    apv_data: {},
  };

  let baseArray = income.split("/");

  if (baseArray.length != 6) {
    return result;
  }

  result.main_data["cmd"] = baseArray[1];
  result.main_data["version"] = baseArray[2];
  result.main_data["sn"] = baseArray[3];
  result.main_data["text"] = baseArray[4];

  result.error = ERRORS.OK;

  return result;
};

let sendReplyToChannel = async (req, data) => {
  let apvConfig = req?.configControl?.apv?.[data.sn];
  if (apvConfig.tgLink.length == 0) return;

  try {
    await req.telegram.sendMessage(
      `@${apvConfig.tgLink}`,
      `${apvConfig.sn} : Ответ на команду: "${data.cmd}". Версия: "${data.version}". Сообщение : "${data.text}"`
    );
  } catch (e) {
    console.log(
      req.timeLogFormated +
        ": reply: TELEGRAM_ERROR: " +
        apvConfig.sn +
        " : " +
        e?.response?.description
    );
  }
};

module.exports = router;
