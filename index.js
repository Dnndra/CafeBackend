const express = require('express');
const bodyParser = require('body-parser');
const db = require('better-sqlite3')('./db/cafeteria.db');

const app = express();
const port = 3000;


app.use(bodyParser.json());


const usersRoutes = require('./routes/users');
const clientsRoutes = require('./routes/clients');
const productsRoutes = require('./routes/products');
const consumptionRoutes = require('./routes/consumption');

app.use('/api/users', usersRoutes(db));
app.use('/api/clients', clientsRoutes(db));
app.use('/api/products', productsRoutes(db));
app.use('/api/consumption', consumptionRoutes(db));

app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
