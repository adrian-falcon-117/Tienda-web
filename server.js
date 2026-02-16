const express = require("express");
const path = require("path");
const app = express();

const port = process.env.PORT || 8080;

// Servir archivos estáticos generados por Webpack
app.use(express.static(path.join(__dirname, "dist")));

// Rutas personalizadas 
app.get("/admin", (req, res) => { res.sendFile(path.join(__dirname, "dist", "admin.html")); }); 
app.get("/login", (req, res) => { res.sendFile(path.join(__dirname, "dist", "login.html")); });

// Fallback para SPA (si usas React Router o rutas dinámicas)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(port, () => {
    console.log(`Servidor escuchando en puerto ${port}`);
});
