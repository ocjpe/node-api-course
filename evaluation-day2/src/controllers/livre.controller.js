const livreService = require("../services/livre.service");
const { livreSchema } = require("../validators/livre.validator");

async function getAll(req, res, next) {
  try {
    const livres = await livreService.getAll();
    res.json(livres);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const livre = await livreService.getById(Number(req.params.id));
    res.json(livre);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = livreSchema.parse(req.body);
    const livre = await livreService.create(data);
    res.status(201).json(livre);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.errors });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = livreSchema.parse(req.body);
    const livre = await livreService.update(Number(req.params.id), data);
    res.json(livre);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.errors });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await livreService.remove(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function emprunter(req, res, next) {
  try {
    const emprunt = await livreService.emprunter(Number(req.params.id), req.user.id);
    res.status(201).json(emprunt);
  } catch (err) {
    next(err);
  }
}

async function retourner(req, res, next) {
  try {
    const emprunt = await livreService.retourner(Number(req.params.id), req.user.id);
    res.json(emprunt);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove, emprunter, retourner };
