const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@biblio.fr" },
    update: {},
    create: {
      nom: "Admin",
      email: "admin@biblio.fr",
      password: adminPassword,
      role: "admin",
    },
  });

  const livres = [
    { titre: "Le Petit Prince", auteur: "Antoine de Saint-Exupéry", annee: 1943, genre: "Conte" },
    { titre: "Les Misérables", auteur: "Victor Hugo", annee: 1862, genre: "Roman" },
    { titre: "L'Étranger", auteur: "Albert Camus", annee: 1942, genre: "Roman" },
  ];

  for (const livre of livres) {
    await prisma.livre.create({ data: livre });
  }

  console.log("Seed terminé !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
