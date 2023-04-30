const mysql = require("mysql2");

const pool = mysql.createPool({
    connectionLimit: 10,
    multipleStatements: true,
    host: 'localhost',
    port: '3306', //'/var/run/mysqld/mysqld.sock',
    database: 'bhf',
    user: 'IDEA',
    password: '123456Aa!',
    timezone: '+00:00'
}).promise();


const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jsonParser = bodyParser.json();

const app = express();

const PORT = 18092;

const server = require('http').createServer(app);

app.use(jsonParser);
app.use(bodyParser.urlencoded({extended: false}));


app.use(cors({
    origin: '*',
    methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Set-Cookie'],
    credentials: true,
}));


// OTHER
app.get('/cities', async (req, res) => {
    try {
        const result = (await pool.query('SELECT id, name FROM city'))[0];

        res.status(200).json(result.map(e => ({id: e.id, name: e.name}))).end();
    } catch (e) {
        console.log(e);
        res.status(200).json([]).end();
    }
});

app.get('/fuel', async (req, res) => {
    try {
        const id = req.query.city;
        const from = new Date(req.query.start);
        const to = new Date(req.query.end);
        
        // TODO: rewrite
        const fuels = (await pool.query('SELECT DISTINCT f.id, f.name, f.type FROM fuel_log fl INNER JOIN fuel f ON fl.fuel_id = f.id WHERE city_id = ? AND date BETWEEN ? AND ?', [id, from, to]))[0];
        for(const bad of fuels)
            bad.price = (await pool.query('SELECT price FROM fuel_log WHERE fuel_id = ? AND city_id = ? AND date BETWEEN ? AND ? ORDER BY id DESC LIMIT 1', [bad.id, id, from, to]))[0][0].price;
        
        res.status(200).json(fuels).end();
    } catch (e) {
        console.log(e);
        res.status(200).json([]).end();
    }
});

app.get('/log', async (req, res) => {
    try {
        const city = +req.query.city;
        const fuel = +req.query.fuel;
        const from = new Date(req.query.start);
        const to = new Date(req.query.end);

        const result = (await pool.query(
            `SELECT date, price
             FROM fuel_log
             WHERE city_id = ? AND fuel_id = ?
               AND date BETWEEN ? AND ?`, [city, fuel, from, to]))[0];
        
        res.status(200).json(result.map(e => ({date: e.date, price: e.price}))).end();
    } catch (e) {
        console.log(e);
        res.status(200).json([]).end();
    }
});


app.use(async (req, res) => {
    res.status(404).send('Not found');
});


server.listen(PORT, () => console.log(`Server start on ${PORT}`));
// server.listen(PORT, '127.0.0.1', () => console.log(`Server start on ${PORT}`))
