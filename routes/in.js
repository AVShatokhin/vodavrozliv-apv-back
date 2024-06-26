var express = require("express");
var router = express.Router();

// это отладка
router.post("/", function (req, res, next) {
  if (req.text) {
    res.send("MESSAGE=" + req.text);
  } else {
    res.send("NO_DATA");
  }
});

module.exports = router;

// console.log(req.body);

// if (req.body["MESSAGE"]) {
//   res.send("MESSAGE=" + req.body["MESSAGE"]);
// } else {
//   res.send("NO_DATA");
// }
