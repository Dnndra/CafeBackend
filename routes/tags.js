const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // Crear tag
    router.post('/', (req, res) => {
        const { tag } = req.body;

        if (!tag) {
            return res.status(400).json({ error: 'El campo tag es obligatorio.' });
        }

        try {
            const existingTag = db.prepare('SELECT * FROM Tags WHERE tag = ?').get(tag);
            if (existingTag) {
                return res.status(400).json({ error: 'Ya existe un tag con el mismo nombre.' });
            }
            const stmt = db.prepare('INSERT INTO Tags (tag) VALUES (?)');
            stmt.run(tag);
            res.status(201).json({ message: 'Tag creado exitosamente.' });
        } catch (err) {
            res.status(400).json({ error: 'Error al crear el tag: ' + err.message });
        }
    });

    // Obtener todos los tags
    router.get('/', (req, res) => {
        try {
            const tags = db.prepare('SELECT * FROM Tags').all();
            res.json(tags);
        } catch (err) {
            res.status(400).json({ error: 'Error al obtener los tags: ' + err.message });
        }
    });

       // Eliminar tag por ID
       router.delete('/:tag', (req, res) => {
        try {
            const stmt = db.prepare('DELETE FROM Tags WHERE tag = ?');
            const result = stmt.run(req.params.tag);

            if (result.changes > 0) {
                res.status(200).json({ message: 'Tag eliminado exitosamente.' });
            } else {
                res.status(404).json({ error: 'Tag no encontrado.' });
            }
        } catch (err) {
            res.status(400).json({ error: 'Error al eliminar el tag: ' + err.message });
        }
    });

    return router;
};