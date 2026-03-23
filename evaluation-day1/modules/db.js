const fs = require('fs/promises');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db.json');

async function readDB() {
  const content = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(content);
}

async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readDB, writeDB };
