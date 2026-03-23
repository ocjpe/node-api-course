const { readDB, writeDB } = require('./db');

function send(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('JSON invalide'));
      }
    });
    req.on('error', reject);
  });
}

async function router(req, res) {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;
  const method = req.method;

  // GET /books
  if (method === 'GET' && pathname === '/books') {
    const db = await readDB();
    let books = db.books;

    // Bonus: filtrage par disponibilité
    const available = urlObj.searchParams.get('available');
    if (available !== null) {
      const filterValue = available === 'true';
      books = books.filter((b) => b.available === filterValue);
    }

    return send(res, 200, { success: true, count: books.length, data: books });
  }

  // GET /books/:id
  const matchGet = pathname.match(/^\/books\/(\d+)$/);
  if (method === 'GET' && matchGet) {
    const id = parseInt(matchGet[1]);
    const db = await readDB();
    const book = db.books.find((b) => b.id === id);
    if (!book) return send(res, 404, { success: false, error: 'Livre introuvable' });
    return send(res, 200, { success: true, data: book });
  }

  // POST /books
  if (method === 'POST' && pathname === '/books') {
    const body = await parseBody(req);
    const { title, author, year } = body;
    if (!title || !author || !year) {
      return send(res, 400, { success: false, error: 'Les champs title, author et year sont requis' });
    }
    const db = await readDB();
    const maxId = db.books.reduce((max, b) => Math.max(max, b.id), 0);
    const newBook = { id: maxId + 1, title, author, year, available: true };
    db.books.push(newBook);
    await writeDB(db);
    return send(res, 201, { success: true, data: newBook });
  }

  // Bonus: DELETE /books/:id
  const matchDelete = pathname.match(/^\/books\/(\d+)$/);
  if (method === 'DELETE' && matchDelete) {
    const id = parseInt(matchDelete[1]);
    const db = await readDB();
    const index = db.books.findIndex((b) => b.id === id);
    if (index === -1) return send(res, 404, { success: false, error: 'Livre introuvable' });
    const [deleted] = db.books.splice(index, 1);
    await writeDB(db);
    return send(res, 200, { success: true, data: deleted });
  }

  // Route 404 par défaut
  return send(res, 404, { success: false, error: 'Route non trouvée' });
}

module.exports = router;
