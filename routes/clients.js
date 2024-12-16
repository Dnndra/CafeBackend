const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // Crear cliente
    router.post('/', (req, res) => {
        const { name, accountType, balance } = req.body;

        if (!name || !accountType) {
            return res.status(400).send('Todos los campos son obligatorios.');
        }

        try {
            const stmt = db.prepare(
                'INSERT INTO Clients (name, accountType, balance) VALUES (?, ?, ?)'
            );
            stmt.run(name, accountType, balance || 0);
            res.status(201).send('Cliente creado exitosamente.');
        } catch (err) {
            res.status(400).send('Error al crear el cliente: ' + err.message);
        }
    });

    // Obtener todos los clientes
    router.get('/', (req, res) => {
        const clients = db.prepare('SELECT * FROM Clients').all();
        res.json(clients);
    });

    // Obtener cliente por ID
    router.get('/:id', (req, res) => {
        const client = db.prepare('SELECT * FROM Clients WHERE id = ?').get(req.params.id);
        if (client) {
            res.json(client);
        } else {
            res.status(404).send('Cliente no encontrado.');
        }
    });

    // Actualizar cliente
    router.put('/:id', (req, res) => {
        const { name, accountType, balance } = req.body;

        const stmt = db.prepare(
            'UPDATE Clients SET name = ?, accountType = ?, balance = ? WHERE id = ?'
        );
        const result = stmt.run(name, accountType, balance, req.params.id);

        if (result.changes > 0) {
            res.send('Cliente actualizado exitosamente.');
        } else {
            res.status(404).send('Cliente no encontrado.');
        }
    });

    // Eliminar cliente
    router.delete('/:id', (req, res) => {
        const stmt = db.prepare('DELETE FROM Clients WHERE id = ?');
        const result = stmt.run(req.params.id);

        if (result.changes > 0) {
            res.send('Cliente eliminado exitosamente.');
        } else {
            res.status(404).send('Cliente no encontrado.');
        }
    });

    return router;
};
