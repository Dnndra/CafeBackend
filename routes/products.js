const express = require('express');
const multer = require('multer');
const path = require('path');

module.exports = (db) => {
    const router = express.Router();

    // Configuración de multer para almacenar imágenes en memoria y aceptar archivos más grandes
    const storage = multer.memoryStorage();
    const upload = multer({ 
        storage: storage,
        limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
    });

    // Crear producto con imagen
    router.post('/', upload.single('image'), (req, res) => {
        const { name, stock, price, threshold, tag } = req.body;
        const image = req.file ? req.file.buffer : null;

        if (!name || !price || !tag || !image) {
            return res.status(400).json({ error: 'Los campos name, price, tag e image son obligatorios.' });
        }

        const stockValue = stock != null ? stock : 0; // Valor predeterminado para stock
        const thresholdValue = threshold != null ? threshold : 5; // Valor predeterminado para threshold

        try {
            const existingProduct = db.prepare('SELECT * FROM Products WHERE name = ?').get(name);
            if (existingProduct) {
                return res.status(400).json({ error: 'Ya existe un producto con el mismo nombre.' });
            }
            const stmt = db.prepare(
                'INSERT INTO Products (name, stock, price, threshold, tag, image) VALUES (?, ?, ?, ?, ?, ?)'
            );
            stmt.run(name, stockValue, price, thresholdValue, tag, image);
            res.status(201).json({ message: 'Producto creado exitosamente.' });
        } catch (err) {
            res.status(400).json({ error: 'Error al crear el producto: ' + err.message });
        }
    });

    // Obtener todos los productos
    router.get('/', (req, res) => {
        const products = db.prepare('SELECT * FROM Products').all();
        const productsWithImages = products.map(product => ({
            ...product,
            image: product.image ? product.image.toString('base64') : null
        }));
        res.json(productsWithImages);
    });

    // Obtener producto por ID
    router.get('/:id', (req, res) => {
        const product = db.prepare('SELECT * FROM Products WHERE id = ?').get(req.params.id);
        if (product) {
            res.json({
                id: product.id,
                name: product.name,
                stock: product.stock,
                price: product.price,
                threshold: product.threshold,
                tag: product.tag,
                image: product.image ? product.image.toString('base64') : null // Convertir la imagen a base64
            });
        } else {
            res.status(404).json({ error: 'Producto no encontrado.' });
        }
    });

    // Obtener productos por tag
    router.get('/tag/:tag', (req, res) => {
        const products = db.prepare('SELECT * FROM Products WHERE tag = ?').all(req.params.tag);
        const productsWithImages = products.map(product => ({
            ...product,
            image: product.image ? product.image.toString('base64') : null
        }));
        res.json(productsWithImages);
    });

    // Obtener productos por nombre parcial
    router.get('/name/:name', (req, res) => {
        const products = db.prepare('SELECT * FROM Products WHERE name LIKE ?').all(`%${req.params.name}%`);
        const productsWithImages = products.map(product => ({
            ...product,
            image: product.image ? product.image.toString('base64') : null
        }));
        res.json(productsWithImages);
    });

    // Actualizar producto
    router.put('/:id', upload.single('image'), (req, res) => {
        const { name, stock, price, threshold, tag } = req.body;
        const image = req.file ? req.file.buffer : null;

        // Obtener la imagen existente si no se proporciona una nueva
        let existingImage;
        if (!image) {
            const existingProduct = db.prepare('SELECT image FROM Products WHERE id = ?').get(req.params.id);
            existingImage = existingProduct ? existingProduct.image : null;
        }

        const stockValue = stock != null ? stock : 0; // Valor predeterminado para stock
        const thresholdValue = threshold != null ? threshold : 5; // Valor predeterminado para threshold

        const stmt = db.prepare(
            'UPDATE Products SET name = ?, stock = ?, price = ?, threshold = ?, tag = ?, image = ? WHERE id = ?'
        );
        const result = stmt.run(name, stockValue, price, thresholdValue, tag, image || existingImage, req.params.id);

        if (result.changes > 0) {
            res.status(200).json({ message: 'Producto actualizado exitosamente.' });
        } else {
            res.status(404).json({ error: 'Producto no encontrado.' });
        }
    });

    // Eliminar producto
    router.delete('/:id', (req, res) => {
        const stmt = db.prepare('DELETE FROM Products WHERE id = ?');
        const result = stmt.run(req.params.id);

        if (result.changes > 0) {
            res.status(200).json({ message: 'Producto eliminado exitosamente.' });
        } else {
            res.status(404).json({ error: 'Producto no encontrado.' });
        }
    });

    return router;
};