const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // Crear producto
    router.post('/', (req, res) => {
        const { name, stock, price, threshold, tag } = req.body;
        if (!name || stock == null || !price || !tag) {
            return res.status(400).send('Todos los campos son obligatorios.');
        }
        try {
            const existingProduct = db.prepare('SELECT * FROM Products WHERE name = ?').get(name);
            if (existingProduct) {
                return res.status(400).send('Ya existe un producto con el mismo nombre');
            }
            const stmt = db.prepare(
                'INSERT INTO Products (name, stock, price, threshold, tag) VALUES (?, ?, ?, ?, ?)'
            );
            stmt.run(name, stock, price, threshold || 5, tag);
            res.status(201).send('Producto creado exitosamente.');
        } catch (err) {
            res.status(400).send('Error al crear el producto: ' + err.message);
        }
    });

    // Obtener todos los productos
    router.get('/', (req, res) => {
        const products = db.prepare('SELECT * FROM Products').all();
        res.json(products);
    });

    // Obtener producto por ID
    router.get('/:id', (req, res) => {
        const product = db.prepare('SELECT * FROM Products WHERE id = ?').get(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).send('Producto no encontrado.');
        }
    });

    // Obtener productos por tag
    router.get('/tag/:tag', (req, res) => {
        const products = db.prepare('SELECT * FROM Products WHERE tag = ?').all(req.params.tag);
        res.json(products);
    });

    // Obtener productos por nombre parcial
    router.get('/name/:name', (req, res) => {
        const products = db.prepare('SELECT * FROM Products WHERE name LIKE ?').all(`%${req.params.name}%`);
        res.json(products);
    });



    // Actualizar producto
    router.put('/:id', (req, res) => {
        const { name, stock, price, threshold, tag } = req.body;

        const stmt = db.prepare(
            'UPDATE Products SET name = ?, stock = ?, price = ?, threshold = ? WHERE id = ?'
        );
        const result = stmt.run(name, stock, price, threshold, req.params.id);

        if (result.changes > 0) {
            res.send('Producto actualizado exitosamente.');
        } else {
            res.status(404).send('Producto no encontrado.');
        }
    });

    // Eliminar producto
    router.delete('/:id', (req, res) => {
        const stmt = db.prepare('DELETE FROM Products WHERE id = ?');
        const result = stmt.run(req.params.id);

        if (result.changes > 0) {
            res.send('Producto eliminado exitosamente.');
        } else {
            res.status(404).send('Producto no encontrado.');
        }
    });

    return router;
};
