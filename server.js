// server.js - Backend Full-Stack Autocontenido (Sin necesidad de MySQL / XAMPP)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const JUEGOS_FILE = path.join(__dirname, 'juegos.json');
const COMENTARIOS_FILE = path.join(__dirname, 'comentarios.json');

const leerDatos = (filePath, datosPorDefecto) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(datosPorDefecto, null, 2));
        return datosPorDefecto;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

const guardarDatos = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

let catálogoJuegos = leerDatos(JUEGOS_FILE, [
    { id: 1, titulo: "TEKKEN 8", precio: 14.99, imagen: "IMGS/Tekken8.jpg" },
    { id: 2, titulo: "Kingdom Hearts IV", precio: 99.99, imagen: "IMGS/Kingdom_Hearts_IV.jpg" },
    { id: 3, titulo: "Marvel Spiderman 3", precio: 69.99, imagen: "IMGS/Marvel_Spiderman_3.jpg" },
    { id: 4, titulo: "Grand Theft Auto VI", precio: 99.99, imagen: "IMGS/GTAVI.jpg" },
    { id: 5, titulo: "Dying Light: The Beast", precio: 59.99, imagen: "IMGS/Dying_Light_Beast.jpg" },
    { id: 6, titulo: "Furi", precio: 6.50, imagen: "IMGS/Furi.jpg" },
    { id: 7, titulo: "Bloodborne PC Edition", precio: 79.99, imagen: "IMGS/Bloodborne.jpg" }
]);

let historialComentarios = leerDatos(COMENTARIOS_FILE, [
    { id: 1, id_juego: 1, mensaje: "El juego tiene tirones en el menú principal.", respuesta_dev: "Estamos trabajando en un parche de optimización.", juego_titulo: "TEKKEN 8", usuario_nombre: "pablo" }
]);

console.log('🚀 Base de datos JSON autocontenida inicializada correctamente.');

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Campos requeridos vacíos' });
    
    let rol = 'USER';
    if (email.includes('admin')) rol = 'ADMIN';
    else if (email.includes('dev')) rol = 'DEV';

    res.json({ 
        success: true, 
        user: { id: 1, email, rol, username: email.split('@')[0] } 
    });
});

app.get('/api/juegos', (req, res) => {
    res.json(catálogoJuegos);
});

app.post('/api/juegos', (req, res) => {
    const { titulo, precio } = req.body;
    if (!titulo || precio === undefined) return res.status(400).json({ error: 'Estructura JSON incompleta' });

    const nuevoJuego = {
        id: Date.now(),
        titulo,
        precio: parseFloat(precio)
    };

    catálogoJuegos.push(nuevoJuego);
    guardarDatos(JUEGOS_FILE, catálogoJuegos);
    res.status(201).json({ success: true, id: nuevoJuego.id });
});

app.get('/api/comentarios', (req, res) => {
    res.json(historialComentarios);
});

app.post('/api/comentarios', (req, res) => {
    const { id_juego, mensaje } = req.body;
    if (!id_juego || !mensaje) return res.status(400).json({ error: 'Parámetros inconsistentes' });

    const juego = catálogoJuegos.find(g => g.id === parseInt(id_juego));
    const tituloJuego = juego ? juego.titulo : "Juego Desconocido";

    const nuevoComentario = {
        id: Date.now(),
        id_juego: parseInt(id_juego),
        mensaje,
        respuesta_dev: null,
        juego_titulo: tituloJuego,
        usuario_nombre: "Invitado Nexus"
    };

    historialComentarios.push(nuevoComentario);
    guardarDatos(COMENTARIOS_FILE, historialComentarios);
    res.json({ success: true, id: nuevoComentario.id });
});

app.put('/api/comentarios/:id/respuesta', (req, res) => {
    const commentId = parseInt(req.params.id);
    const { respuesta_dev } = req.body;

    const comentario = historialComentarios.find(c => c.id === commentId);
    if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado' });

    comentario.respuesta_dev = respuesta_dev;
    guardarDatos(COMENTARIOS_FILE, historialComentarios);
    res.json({ success: true });
});

app.listen(PORT, () => console.log('📡 Endpoints API REST activos en http://localhost:' + PORT));