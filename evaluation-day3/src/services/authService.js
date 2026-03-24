const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../db/prisma");
const { JWT_SECRET } = require("../config/env");

async function register({ nom, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email déjà utilisé");
    err.status = 409;
    throw err;
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { nom, email, password: hash },
  });

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessToken };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const err = new Error("Email ou mot de passe incorrect");
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error("Email ou mot de passe incorrect");
    err.status = 401;
    throw err;
  }

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessToken, refreshToken };
}

async function refresh(token) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
    }
    const err = new Error("Refresh token invalide ou expiré");
    err.status = 401;
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  return { accessToken };
}

async function logout(token) {
  if (!token) return;
  await prisma.refreshToken.deleteMany({ where: { token } });
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error("Utilisateur introuvable");
    err.status = 404;
    throw err;
  }
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

module.exports = { register, login, refresh, logout, getProfile };
