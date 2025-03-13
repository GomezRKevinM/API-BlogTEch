const express = require('express');
const session = require('express-session');
const cors = require('cors');
const mysql = require('mysql');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 8080;

// Configuración de la sesión
app.use(session({
    secret: process.env.SESSION_SECRET || 'S3cUr3!s3sS10nK3y@2025',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Configuración de CORS
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
};
app.use(cors(corsOptions));

// Middleware para logging
app.use(morgan('dev'));

// Conexión a la base de datos
const conexion = mysql.createConnection({
    host: process.env.host || 'localhost',
    user: process.env.user || 'root',
    password: process.env.password || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.database || 'mydatabase'
});

conexion.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
        process.exit(1);
    } else {
        console.log("Conexión exitosa");
    }
});

// Funciones de base de datos
function selecionarDatos(tabla, tipo, columna, id) {
    return new Promise((resolve, reject) => {
        let query;
        switch (tipo) {
            case "Normal":
                query = `SELECT * FROM ${tabla}`;
                break;
            case "Columna":
                query = `SELECT ${columna} FROM ${tabla}`;
                break;
            case "Unico":
                query = `SELECT * FROM ${tabla} WHERE ${columna} = ?`;
                break;
            default:
                reject(new Error('Tipo de consulta no válido'));
                return;
        }

        const params = tipo === "Unico" ? [id] : [];
        conexion.query(query, params, (error, lista) => {
            if (error) {
                reject(error);
            } else {
                resolve(lista);
            }
        });
    });
}

function insertarDatos(tabla, values) {
    return new Promise((resolve, reject) => {
        const keys = Object.keys(values).join(',');
        const placeholders = Object.keys(values).map(() => '?').join(',');
        const query = `INSERT INTO ${tabla} (${keys}) VALUES(${placeholders})`;
        const vals = Object.values(values);

        conexion.query(query, vals, (err, lista) => {
            if (err) {
                reject(err);
            } else {
                resolve(lista);
            }
        });
    });
}

function actualizarDatos(tabla, valores, condicion) {
    return new Promise((resolve, reject) => {
        const keys = Object.keys(valores);
        const placeholders = keys.map(key => `${key} = ?`).join(', ');
        const condKeys = Object.keys(condicion);
        const condPlaceholders = condKeys.map(key => `${key} = ?`).join(' AND ');
        const query = `UPDATE ${tabla} SET ${placeholders} WHERE ${condPlaceholders}`;
        const vals = [...Object.values(valores), ...Object.values(condicion)];

        conexion.query(query, vals, (err, resultado) => {
            if (err) {
                reject(err);
            } else {
                resolve(resultado);
            }
        });
    });
}

// Rutas
app.get('/api/users', (req, res) => {
    selecionarDatos("usuarios", "Normal", "*", 0)
        .then(data => res.json(data))
        .catch(err => res.status(500).send(err));
});

app.get('/api/coments', (req, res) => {
    selecionarDatos("comentarios", "Normal", "*", 0)
        .then(data => res.json(data))
        .catch(err => res.status(500).send(err));
});

app.post('/api/user', (req, res) => {
    const values = req.body;
    if (!values || Object.keys(values).length === 0) {
        return res.status(400).json({ exito: false, mensaje: 'El cuerpo de la solicitud está vacío o no es válido.' });
    }
    insertarDatos("usuarios", values)
        .then(data => res.status(201).json({ exito: true, data }))
        .catch(err => res.status(500).json({ exito: false, error: err.message }));
});

app.post('/api/coment', (req, res) => {
    const values = req.body;
    if (!values || Object.keys(values).length === 0) {
        return res.status(400).json({ exito: false, mensaje: 'El cuerpo de la solicitud está vacío o no es válido.' });
    }
    insertarDatos("comentarios", values)
        .then(data => res.status(201).json({ exito: true, data }))
        .catch(err => res.status(500).send(err));
});

app.put('/api/user/update', (req, res) => {
    const { id, ...values } = req.body;
    if (!id || Object.keys(values).length === 0) {
        return res.status(400).json({ exito: false, mensaje: 'Faltan campos obligatorios' });
    }
    const condicion = { id };
    actualizarDatos("usuarios", values, condicion)
        .then(data => res.json({ exito: true, data }))
        .catch(err => res.status(500).json({ exito: false, error: err.message }));
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});