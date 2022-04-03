module.exports = () => {
  let incomes = [];

  return (req, res, next) => {
    if (req.text) {
      incomes.push({ data: req.text, date: new Date() });
      if (incomes.length > 100) {
        incomes.splice(0, 1);
      }
    }
    req.incomes = incomes;

    next();
  };
};
