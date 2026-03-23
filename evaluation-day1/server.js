const http = require('http');
const router = require('./modules/router');

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const start = Date.now();

  try {
    await router(req, res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Erreur interne' }));
  }

  const statusCode = res.statusCode;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} → ${statusCode}`);
});

server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
