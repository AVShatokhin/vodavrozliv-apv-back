module.exports = (config, frontConfig) => {
  return (req, res, next) => {
    req.config = config;
    req.frontConfig = frontConfig;
    next();
  };
};
