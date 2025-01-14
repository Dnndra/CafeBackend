const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const secretKey = 'your_secret_key'; // Cambia esto por una clave secreta segura

module.exports = (db) => {
    // Registro de usuario
    router.post('/register', (req, res) => {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Los campos username, password y role son obligatorios.' });
        }

        try {
            const existingUser = db.prepare('SELECT * FROM Users WHERE username = ?').get(username);
            if (existingUser) {
                return res.status(400).json({ error: 'El nombre de usuario ya está en uso.' });
            }

            const stmt = db.prepare('INSERT INTO Users (username, password, role) VALUES (?, ?, ?)');
            stmt.run(username, password, role);

            res.status(201).json({ message: 'Usuario registrado exitosamente.' });
        } catch (err) {
            res.status(400).json({ error: 'Error al registrar el usuario: ' + err.message });
        }
    });

    // Inicio de sesión de usuario
    router.post('/login', (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Los campos username y password son obligatorios.' });
        }

        try {
            const user = db.prepare('SELECT * FROM Users WHERE username = ?').get(username);
            if (!user || user.password !== password) {
                return res.status(400).json({ error: 'Nombre de usuario o contraseña incorrectos.' });
            }

            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secretKey, { expiresIn: '1h' });
            res.status(200).json({ message: 'Inicio de sesión exitoso.', token, user: { id: user.id, username: user.username, role: user.role } });
        } catch (err) {
            res.status(400).json({ error: 'Error al iniciar sesión: ' + err.message });
        }
    });

    // Middleware para verificar el token
    const verifyToken = (req, res, next) => {
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(403).json({ error: 'No se proporcionó un token.' });
        }

        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Token no válido.' });
            }
            req.user = decoded;
            next();
        });
    };

    // Ejemplo de ruta protegida
    router.get('/protected', verifyToken, (req, res) => {
        res.status(200).json({ message: 'Acceso a ruta protegida concedido.', user: req.user });
    });

    return router;
};