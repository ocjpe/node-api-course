const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticate = require("../middlewares/authenticate");

// Rate limiter strict sur login et register : 10 req / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives, réessayez plus tard" },
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Créer un nouveau compte utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, email, password]
 *             properties:
 *               nom:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Email déjà utilisé
 */
router.post("/register", authLimiter, authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Se connecter et obtenir un access token + refresh token (cookie)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Email ou mot de passe incorrect
 */
router.post("/login", authLimiter, authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Rafraîchir l'access token via le cookie refreshToken
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Nouveau access token
 *       401:
 *         description: Refresh token manquant, invalide ou expiré
 */
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Se déconnecter (supprime le refresh token)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtenir le profil de l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès interdit
 */
router.get("/me", authenticate, authController.me);

module.exports = router;
