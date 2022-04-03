var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

const conf = require("./etc/config");
var mysql = require("./libs/mysql-middle")(conf);
var config = require("./libs/config-middle")(conf);
var incomes = require("./libs/incomes-log-middle")();

var indexRouter = require("./routes/index");
var inRouter = require("./routes/in");
var logRouter = require("./routes/log");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(function (req, res, next) {
  // функция необходима для сбора текстовых данных в переменную text
  // иначе мы данные через функционал, предоставляемый модулем express получить не можем,
  // express умеет парсить только данные с форм, либо бинарные данные при загрузке файлов,
  // а для получения обычных текстовых данных у экспресса нет механизмов
  if (req.is("text/*")) {
    req.text = "";
    req.setEncoding("utf8");
    req.on("data", function (chunk) {
      req.text += chunk;
    });
    req.on("end", next);
  } else {
    next();
  }
});

app.use(config);
app.use(mysql);
app.use(incomes);

app.use("/", indexRouter);
app.use("/in", inRouter);
app.use("/log", logRouter);

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
