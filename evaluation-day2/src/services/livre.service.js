const prisma = require("../db/prisma");

async function getAll() {
  return prisma.livre.findMany();
}

async function getById(id) {
  const livre = await prisma.livre.findUnique({ where: { id } });
  if (!livre) {
    const err = new Error("Livre introuvable");
    err.status = 404;
    throw err;
  }
  return livre;
}

async function create(data) {
  return prisma.livre.create({ data });
}

async function update(id, data) {
  const livre = await prisma.livre.findUnique({ where: { id } });
  if (!livre) {
    const err = new Error("Livre introuvable");
    err.status = 404;
    throw err;
  }
  return prisma.livre.update({ where: { id }, data });
}

async function remove(id) {
  const livre = await prisma.livre.findUnique({ where: { id } });
  if (!livre) {
    const err = new Error("Livre introuvable");
    err.status = 404;
    throw err;
  }
  return prisma.livre.delete({ where: { id } });
}

async function emprunter(livreId, userId) {
  return prisma.$transaction(async (tx) => {
    const livre = await tx.livre.findUnique({ where: { id: livreId } });
    if (!livre) {
      const err = new Error("Livre introuvable");
      err.status = 404;
      throw err;
    }
    if (!livre.disponible) {
      const err = new Error("Livre non disponible");
      err.status = 409;
      throw err;
    }

    await tx.livre.update({
      where: { id: livreId },
      data: { disponible: false },
    });

    const emprunt = await tx.emprunt.create({
      data: { livreId, userId },
    });

    return emprunt;
  });
}

async function retourner(livreId, userId) {
  return prisma.$transaction(async (tx) => {
    const emprunt = await tx.emprunt.findFirst({
      where: { livreId, userId, dateRetour: null },
    });
    if (!emprunt) {
      const err = new Error("Aucun emprunt en cours pour ce livre");
      err.status = 404;
      throw err;
    }

    await tx.livre.update({
      where: { id: livreId },
      data: { disponible: true },
    });

    const updated = await tx.emprunt.update({
      where: { id: emprunt.id },
      data: { dateRetour: new Date() },
    });

    return updated;
  });
}

module.exports = { getAll, getById, create, update, remove, emprunter, retourner };
