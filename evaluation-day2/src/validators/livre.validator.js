const { z } = require("zod");

const livreSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  auteur: z.string().min(1, "L'auteur est requis"),
  annee: z.number().int().optional(),
  genre: z.string().optional(),
});

module.exports = { livreSchema };
