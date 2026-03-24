require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const { NODE_ENV, ALLOWED_ORIGINS } = require("./config/env");

const authRoutes = require("./routes/auth");
const livreRoutes = require("./routes/livres");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Helmet
app.use(helmet());

// CORS
const corsOptions =
  NODE_ENV === "production"
    ? { origin: ALLOWED_ORIGINS, credentials: true }
    : { origin: true, credentials: true };
app.use(cors(corsOptions));

// Morgan logging
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

// Rate limiter global : 100 req / 15 min / IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Body parser avec limite de taille
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/livres", livreRoutes);

// 404 — route inconnue
app.use((req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

// Error handler
app.use(errorHandler);

module.exports = app;
