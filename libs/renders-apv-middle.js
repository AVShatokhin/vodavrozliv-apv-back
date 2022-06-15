module.exports = () => {
  return (req, res, next) => {
    res.ok = (cmdParam) => {
      if (cmdParam == undefined) {
        res.send("start/ok/end");
      } else {
        res.send(`start/${cmdParam}/end`);
      }
    };

    res.error = (errorCode, endpoint, data) => {
      res.send(`start/Err:${errorCode}/end`);

      console.log(
        req.timeLogFormated +
          ": ERROR: " +
          endpoint +
          ": " +
          errorCode +
          "; income DATA: " +
          data
      );
    };

    next();
  };
};
