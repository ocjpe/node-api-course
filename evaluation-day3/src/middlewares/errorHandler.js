const { NODE_ENV } = require("../config/env");

function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  // Log sans données sensibles (pas de req.body ni Authorization)
  console.error(`[${new Date().toISOString()}] ${status} - ${err.message}`);
  if (NODE_ENV !== "production") {
    console.error(err.stack);
  }

  if (status >= 500 && NODE_ENV === "production") {
    return res.status(status).json({ error: "Erreur interne" });
  }

  res.status(status).json({ error: err.message || "Erreur interne" });
}

module.exports = errorHandler;
