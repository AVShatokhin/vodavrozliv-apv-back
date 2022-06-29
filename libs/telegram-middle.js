const { Telegraf } = require("telegraf");

module.exports = (config) => {
  let token = config.botToken;
  const bot = new Telegraf(token);
  return (req, res, next) => {
    req.telegram = bot.telegram;
    next();
  };
};
