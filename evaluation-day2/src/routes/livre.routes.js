const express = require("express");
const router = express.Router();
const livreController = require("../controllers/livre.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

router.get("/", livreController.getAll);
router.get("/:id", livreController.getById);
router.post("/", authenticate, livreController.create);
router.put("/:id", authenticate, livreController.update);
router.delete("/:id", authenticate, authorize("admin"), livreController.remove);
router.post("/:id/emprunter", authenticate, livreController.emprunter);
router.post("/:id/retourner", authenticate, livreController.retourner);

module.exports = router;
