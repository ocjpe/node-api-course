require("dotenv").config();
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const prisma = require("../src/db/prisma");

let userToken;
let adminToken;
let livreId;

before(async () => {
  // Clean DB
  await prisma.emprunt.deleteMany();
  await prisma.livre.deleteMany();
  await prisma.user.deleteMany();
});

after(async () => {
  await prisma.emprunt.deleteMany();
  await prisma.livre.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

// ──────────────────────────────────────────────
// Section 2 — Authentification JWT
// ──────────────────────────────────────────────
describe("Section 2 — Authentification", () => {
  it("POST /api/auth/register → 201 + {user, token}, password hashé", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ nom: "Alice", email: "alice@test.com", password: "password123" });

    assert.equal(res.status, 201);
    assert.ok(res.body.user);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, "alice@test.com");
    assert.equal(res.body.user.password, undefined, "password should not be returned");

    // Verify bcrypt hash in DB
    const dbUser = await prisma.user.findUnique({ where: { email: "alice@test.com" } });
    assert.ok(dbUser.password.startsWith("$2"), "password should be bcrypt hashed");

    userToken = res.body.token;
  });

  it("POST /api/auth/register → 409 si email déjà utilisé", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ nom: "Alice2", email: "alice@test.com", password: "password123" });

    assert.equal(res.status, 409);
  });

  it("POST /api/auth/register → 400 si email invalide ou password < 8 chars (Zod)", async () => {
    const res1 = await request(app)
      .post("/api/auth/register")
      .send({ nom: "Bad", email: "not-an-email", password: "password123" });
    assert.equal(res1.status, 400);

    const res2 = await request(app)
      .post("/api/auth/register")
      .send({ nom: "Bad", email: "bad@test.com", password: "short" });
    assert.equal(res2.status, 400);
  });

  it("POST /api/auth/login → 200 + {user, token}", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@test.com", password: "password123" });

    assert.equal(res.status, 200);
    assert.ok(res.body.user);
    assert.ok(res.body.token);
    userToken = res.body.token;
  });

  it("POST /api/auth/login → 401 si email incorrect", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "unknown@test.com", password: "password123" });

    assert.equal(res.status, 401);
  });

  it("POST /api/auth/login → 401 si password incorrect", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@test.com", password: "wrongpassword" });

    assert.equal(res.status, 401);
  });

  it("GET /api/auth/me → profil sans password avec token valide", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.email);
    assert.equal(res.body.password, undefined, "password should not be returned");
  });
});

// ──────────────────────────────────────────────
// Section 3 — Middlewares auth & autorisation
// ──────────────────────────────────────────────
describe("Section 3 — Middlewares", () => {
  before(async () => {
    // Create admin user
    const res = await request(app)
      .post("/api/auth/register")
      .send({ nom: "Admin", email: "admin@test.com", password: "password123" });
    // Promote to admin directly in DB
    await prisma.user.update({
      where: { email: "admin@test.com" },
      data: { role: "admin" },
    });
    // Re-login to get token with admin role
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.com", password: "password123" });
    adminToken = loginRes.body.token;
  });

  it("401 si pas de token (Authorization header absent)", async () => {
    const res = await request(app).get("/api/auth/me");
    assert.equal(res.status, 401);
  });

  it("401 si token invalide", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.here");
    assert.equal(res.status, 401);
  });

  it("401 avec message 'Token expiré' si token expiré", async () => {
    const expiredToken = jwt.sign(
      { id: 1, email: "alice@test.com", role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "0s" }
    );
    // Small delay to ensure expiry
    await new Promise((r) => setTimeout(r, 50));

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    assert.equal(res.status, 401);
    assert.match(res.body.error, /expiré/i);
  });

  it("DELETE /api/livres/:id → 403 pour un user non-admin", async () => {
    // Create a book first
    const livre = await request(app)
      .post("/api/livres")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ titre: "Temp", auteur: "Temp" });

    const res = await request(app)
      .delete(`/api/livres/${livre.body.id}`)
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(res.status, 403);
  });

  it("DELETE /api/livres/:id → 204 pour un admin", async () => {
    const livre = await request(app)
      .post("/api/livres")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ titre: "ToDelete", auteur: "Admin" });

    const res = await request(app)
      .delete(`/api/livres/${livre.body.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 204);
  });
});

// ──────────────────────────────────────────────
// Section 4 — Logique métier emprunts
// ──────────────────────────────────────────────
describe("Section 4 — Emprunts", () => {
  before(async () => {
    const res = await request(app)
      .post("/api/livres")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ titre: "Le Petit Prince", auteur: "Saint-Exupéry" });
    livreId = res.body.id;
  });

  it("POST /api/livres/:id/emprunter → crée un emprunt et met disponible à false", async () => {
    const res = await request(app)
      .post(`/api/livres/${livreId}/emprunter`)
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(res.status, 201);
    assert.ok(res.body.id);

    // Verify livre is now unavailable
    const livre = await request(app).get(`/api/livres/${livreId}`);
    assert.equal(livre.body.disponible, false);
  });

  it("POST /api/livres/:id/emprunter → 409 si livre non disponible", async () => {
    const res = await request(app)
      .post(`/api/livres/${livreId}/emprunter`)
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(res.status, 409);
  });

  it("POST /api/livres/:id/retourner → met disponible à true et remplit dateRetour", async () => {
    const res = await request(app)
      .post(`/api/livres/${livreId}/retourner`)
      .set("Authorization", `Bearer ${userToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.dateRetour, "dateRetour should be set");

    // Verify livre is available again
    const livre = await request(app).get(`/api/livres/${livreId}`);
    assert.equal(livre.body.disponible, true);
  });
});
