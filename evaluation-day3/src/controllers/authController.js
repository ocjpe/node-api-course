const authService = require("../services/authService");
const { registerSchema, loginSchema } = require("../validators/authValidator");
const { NODE_ENV } = require("../config/env");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
  path: "/",
};

async function register(req, res, next) {
  try {
    const { nom, email, password } = registerSchema.parse(req.body);
    const result = await authService.register({ nom, email, password });
    res.status(201).json(result);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.errors });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login({ email, password });

    res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

    res.json({
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.errors });
    }
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ error: "Refresh token manquant" });
    }
    const result = await authService.refresh(token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    await authService.logout(token);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    res.json({ message: "Déconnexion réussie" });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, me };
