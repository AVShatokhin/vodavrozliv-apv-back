module.exports = (req, res, next) => {
  let n = (i) => {
    s = new String(i);
    if (s.length == 1) return `0${s}`;
    else return s;
  };

  let d = new Date();
  req.timeLogFormated = `${n(d.getDate())}.${n(
    d.getMonth() + 1
  )}.${d.getFullYear()} ${n(d.getHours())}.${n(d.getMinutes())}.${n(
    d.getSeconds()
  )}`;

  req.timestamp = Date.now();

  next();
};
