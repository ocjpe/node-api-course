const express = require("express");
const router = express.Router();
const livreController = require("../controllers/livresController");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

/**
 * @swagger
 * /livres:
 *   get:
 *     summary: Lister tous les livres
 *     tags: [Livres]
 *     responses:
 *       200:
 *         description: Liste des livres
 */
router.get("/", livreController.getAll);

/**
 * @swagger
 * /livres/{id}:
 *   get:
 *     summary: Obtenir un livre par son ID
 *     tags: [Livres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails du livre
 *       404:
 *         description: Livre introuvable
 */
router.get("/:id", livreController.getById);

/**
 * @swagger
 * /livres:
 *   post:
 *     summary: Ajouter un nouveau livre
 *     tags: [Livres]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titre, auteur]
 *             properties:
 *               titre:
 *                 type: string
 *               auteur:
 *                 type: string
 *               annee:
 *                 type: integer
 *               genre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Livre créé
 *       401:
 *         description: Token manquant ou invalide
 */
router.post("/", authenticate, livreController.create);

router.put("/:id", authenticate, livreController.update);
router.delete("/:id", authenticate, authorize("admin"), livreController.remove);
router.post("/:id/emprunter", authenticate, livreController.emprunter);
router.post("/:id/retourner", authenticate, livreController.retourner);

module.exports = router;
