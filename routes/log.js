var express = require("express");
var router = express.Router();

/* GET users listing. */

router.get("/", function (req, res, next) {
  let norm = (input) => {
    return input > 10 ? input : "0" + input;
  };

  let data = "";

  req.incomes.reverse().forEach((el) => {
    let now = el.date;
    let logData =
      norm(now.getHours()) +
      ":" +
      norm(now.getMinutes()) +
      ":" +
      norm(now.getSeconds());

    data += logData + " - " + el.data + "<br>";
  });
  res.send(data);
});

module.exports = router;
