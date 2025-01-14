const express = require('express');
const bodyParser = require('body-parser');
const db = require('better-sqlite3')('./db/cafeteria.db');
const cors = require('cors');

const app = express();
const port = 3000;

// Configurar body-parser para aceptar cuerpos de solicitud más grandes
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors()); // Usa el middleware cors

const usersRoutes = require('./routes/users');
const clientsRoutes = require('./routes/clients');
const productsRoutes = require('./routes/products');
const consumptionRoutes = require('./routes/consumption');
const tagsRoutes = require('./routes/tags'); // Importa la nueva ruta de tags
const authRoutes = require('./routes/auth'); 

app.use('/api/users', usersRoutes(db));
app.use('/api/clients', clientsRoutes(db));
app.use('/api/products', productsRoutes(db));
app.use('/api/consumption', consumptionRoutes(db));
app.use('/api/tags', tagsRoutes(db)); // Usa la nueva ruta de tags
app.use('/api/auth', authRoutes(db));

app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});