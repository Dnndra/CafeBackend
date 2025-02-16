const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // Registrar consumo
    router.post('/', (req, res) => {
        const { clientId, products } = req.body;

        if (!clientId || !products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios y products debe ser un array no vacío.' });
        }

        try {
            const client = db.prepare('SELECT accountType, balance FROM Clients WHERE id = ?').get(clientId);
            if (!client) {
                return res.status(400).json({ error: 'Cliente no encontrado.' });
            }

            let totalPrice = 0;
            const productUpdates = [];

            for (const { productId, quantity } of products) {
                const product = db.prepare('SELECT stock, price FROM Products WHERE id = ?').get(productId);
              /*  if (!product || product.stock < quantity) {
                    return res.status(400).json({ error: `Stock insuficiente o producto no encontrado para el producto ID: ${productId}.` });
                }*/

                totalPrice += product.price * quantity;
                productUpdates.push({ productId, quantity });
            }

            // Actualizar balance del cliente según el tipo de cuenta
            let newBalance;
            if (client.accountType === 'Wallet') {
                newBalance = client.balance - totalPrice;
                if (newBalance < 0) {
                    return res.status(400).json({ error: 'Saldo insuficiente.' });
                }
            } else if (client.accountType === 'Abierta' || client.accountType === 'Credito') {
                newBalance = client.balance + totalPrice;
            } else {
                return res.status(400).json({ error: 'Tipo de cuenta no válido.' });
            }

            // Registrar consumo y actualizar stock de productos
            const insertStmt = db.prepare(
                'INSERT INTO ConsumptionHistory (clientId, productId, quantity, totalPrice) VALUES (?, ?, ?, ?)'
            );
            const updateStockStmt = db.prepare('UPDATE Products SET stock = stock - ? WHERE id = ?');

            for (const { productId, quantity } of productUpdates) {
                const product = db.prepare('SELECT price FROM Products WHERE id = ?').get(productId);
                insertStmt.run(clientId, productId, quantity, product.price * quantity);
               // updateStockStmt.run(quantity, productId);
            }

            // Actualizar balance del cliente
            db.prepare('UPDATE Clients SET balance = ? WHERE id = ?').run(newBalance, clientId);

            res.status(201).json({ message: 'Consumo registrado exitosamente.' });
        } catch (err) {
            res.status(400).json({ error: 'Error al registrar el consumo: ' + err.message });
        }
    });

    // Obtener historial de consumo
    router.get('/', (req, res) => {
        try {
            const history = db.prepare(
                `SELECT ch.*, c.name AS clientName, p.name AS productName
                 FROM ConsumptionHistory ch
                 JOIN Clients c ON ch.clientId = c.id
                 JOIN Products p ON ch.productId = p.id`
            ).all();
            res.json(history);
        } catch (err) {
            res.status(400).json({ error: 'Error al obtener el historial de consumo: ' + err.message });
        }
    });

    // Obtener historial de consumo por nombre del cliente
    router.get('/client/:name', (req, res) => {
        try {
            const history = db.prepare(
                `SELECT ch.*, c.name AS clientName, p.name AS productName
                 FROM ConsumptionHistory ch
                 JOIN Clients c ON ch.clientId = c.id
                 JOIN Products p ON ch.productId = p.id
                 WHERE c.name LIKE ?`
            ).all(`%${req.params.name}%`);
            res.json(history);
        } catch (err) {
            res.status(400).json({ error: 'Error al obtener el historial de consumo: ' + err.message });
        }
    });

    // Obtener historial de consumo por ID del cliente y rango de fechas
    router.get('/client/:id/history', (req, res) => {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Los parámetros startDate y endDate son obligatorios.' });
        }

        try {
            const history = db.prepare(
                `SELECT ch.*, c.name AS clientName, p.name AS productName
                 FROM ConsumptionHistory ch
                 JOIN Clients c ON ch.clientId = c.id
                 JOIN Products p ON ch.productId = p.id
                 WHERE ch.clientId = ? AND ch.date BETWEEN ? AND ?`
            ).all(id, startDate, endDate);
            res.json(history);
        } catch (err) {
            res.status(400).json({ error: 'Error al obtener el historial de consumo: ' + err.message });
        }
    });

    router.get('/history', (req, res) => {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Los parámetros de fecha inicial y final son obligatorios.' });
        }

        try {
            const history = db.prepare(
                `SELECT ch.*, c.name AS clientName, p.name AS productName
                 FROM ConsumptionHistory ch
                 JOIN Clients c ON ch.clientId = c.id
                 JOIN Products p ON ch.productId = p.id
                 WHERE ch.date BETWEEN ? AND ?`
            ).all(startDate, endDate);
            res.json(history);
        } catch (err) {
            res.status(400).json({ error: 'Error al obtener el historial de consumo: ' + err.message });
        }
    });


    

    return router;
};