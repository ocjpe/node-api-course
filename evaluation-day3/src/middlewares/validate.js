function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: err.errors });
      }
      next(err);
    }
  };
}

module.exports = validate;
