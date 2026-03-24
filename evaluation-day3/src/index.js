const app = require("./app");
const { PORT } = require("./config/env");

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
