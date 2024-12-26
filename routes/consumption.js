const express = require('express');
module.exports = (db) => {
    const router = express.Router();
// Registrar consumo
router.post('/', (req, res) => {
    const { clientId, productId, quantity } = req.body;

    if (!clientId || !productId || !quantity) {
        return res.status(400).send('Todos los campos son obligatorios.');
    }

    try {
        const product = db.prepare('SELECT stock, price FROM Products WHERE id = ?').get(productId);
        if (!product || product.stock < quantity) {
            return res.status(400).send('Stock insuficiente o producto no encontrado.');
        }

        const totalPrice = product.price * quantity;

        const client = db.prepare('SELECT accountType, balance FROM Clients WHERE id = ?').get(clientId);
        if (!client) {
            return res.status(400).send('Cliente no encontrado.');
        }

        // Actualizar balance del cliente según el tipo de cuenta
        let newBalance;
        if (client.accountType === 'prepago') {
            newBalance = client.balance - totalPrice;
            if (newBalance < 0) {
                return res.status(400).send('Saldo insuficiente.');
            }
        } else if (client.accountType === 'postpago' || client.accountType === 'credito') {
            newBalance = client.balance + totalPrice;
        } else {
            return res.status(400).send('Tipo de cuenta no válido.');
        }

        const stmt = db.prepare(
            'INSERT INTO ConsumptionHistory (clientId, productId, quantity, totalPrice) VALUES (?, ?, ?, ?)'
        );
        stmt.run(clientId, productId, quantity, totalPrice);

        // Actualizar stock del producto
        db.prepare('UPDATE Products SET stock = stock - ? WHERE id = ?').run(quantity, productId);

        // Actualizar balance del cliente
        db.prepare('UPDATE Clients SET balance = ? WHERE id = ?').run(newBalance, clientId);

        res.status(201).send('Consumo registrado exitosamente.');
    } catch (err) {
        res.status(400).send('Error al registrar el consumo: ' + err.message);
    }
});

// Obtener historial de consumo
router.get('/', (req, res) => {
    const history = db.prepare(
        `SELECT ch.*, c.name AS clientName, p.name AS productName
         FROM ConsumptionHistory ch
         JOIN Clients c ON ch.clientId = c.id
         JOIN Products p ON ch.productId = p.id`
    ).all();
    res.json(history);
});
return router;
}
