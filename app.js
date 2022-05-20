var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var app = express();

const conf = require("./etc/config");
var mysql = require("./libs/mysql-middle")(conf);
var config = require("./libs/config-middle")(conf);
var collector = require("./libs/collectText-middle");
var ts = require("./libs/ts-middle");
var controlConfig = require("./libs/configControl-middle")(conf);
var render = require("./libs/renders-apv-middle")();

var indexRouter = require("./routes/index");
var syncRouter = require("./routes/sync");

var inRouter = require("./routes/in"); // удалить
var logRouter = require("./routes/log"); // удалить
var incomes = require("./libs/incomes-log-middle")(); // удалить

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(ts);
app.use(collector);
app.use(config);
app.use(mysql);
app.use(controlConfig);
app.use(render);
app.use(incomes); // удалить

app.use("/", indexRouter);
app.use(syncRouter);

app.use("/in", inRouter); // удалить
app.use("/log", logRouter); // удалить

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
