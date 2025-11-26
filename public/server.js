const express = require("express");
const path = require("path");
const app = express();

const port = process.env.PORT || 8080;

// Servir archivos estáticos generados por Webpack
app.use(express.static(path.join(__dirname, "dist")));

// Fallback para SPA (si usas React Router o rutas dinámicas)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
    console.log(`Servidor escuchando en puerto ${port}`);
});
