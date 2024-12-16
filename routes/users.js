const express = require('express');

module.exports = (db) => {
    const router = express.Router();


    // Crear usuario
    router.post('/', (req, res) => {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).send('Todos los campos son obligatorios.');
        }

        try {
            // Verificar si el username ya existe
            const existingUser = db.prepare('SELECT * FROM Users WHERE username = ?').get(username);
            if (existingUser) {
                return res.status(400).send('El nombre de usuario ya está en uso.');
            }

            // Insertar el nuevo usuario
            const stmt = db.prepare('INSERT INTO Users (username, password, role) VALUES (?, ?, ?)');
            stmt.run(username, password, role);
            res.status(201).send('Usuario creado exitosamente.');
        } catch (err) {
            res.status(500).send('Error al crear el usuario: ' + err.message);
        }
    });

    // Leer todos los usuarios
    router.get('/', (req, res) => {
        const users = db.prepare('SELECT id, username, role FROM Users').all();
        res.json(users);
    });

    // Leer un usuario por ID
    router.get('/:id', (req, res) => {
        const user = db.prepare('SELECT id, username, role FROM Users WHERE id = ?').get(req.params.id);
        if (user) {
            res.json(user);
        } else {
            res.status(404).send('Usuario no encontrado.');
        }
    });

    // Actualizar usuario
    router.put('/:id', (req, res) => {
        const { username, password, role } = req.body;

        const stmt = db.prepare('UPDATE Users SET username = ?, password = ?, role = ? WHERE id = ?');
        const info = stmt.run(username, password, role, req.params.id);

        if (info.changes > 0) {
            res.send('Usuario actualizado exitosamente.');
        } else {
            res.status(404).send('Usuario no encontrado.');
        }
    });

    // Eliminar usuario
    router.delete('/:id', (req, res) => {
        const stmt = db.prepare('DELETE FROM Users WHERE id = ?');
        const info = stmt.run(req.params.id);

        if (info.changes > 0) {
            res.send('Usuario eliminado exitosamente.');
        } else {
            res.status(404).send('Usuario no encontrado.');
        }
    });

    return router;
};
