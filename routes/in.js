var express = require("express");
var router = express.Router();

/* GET users listing. */
router.post("/", function (req, res, next) {
  if (req.text) {
    res.send(req.text);
  } else {
    res.send("NO_DATA");
  }
});

module.exports = router;
