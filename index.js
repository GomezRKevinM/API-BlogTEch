import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';  
import mysql from 'mysql';

dotenv.config()


const app = express();
const port = 8080;
const host_server = "https://app-8edf8cb5-03b9-4aaa-b441-2dc3b88977d1.cleverapps.io/";

app.use(session({
    secret: 'S3cUr3!s3sS10nK3y@2025',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

let query;

export const turso = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN,
});


app.use(cors());
app.use(express.json());


function selecionarDatos(tabla,tipo,columna,id){
    return new Promise(async (resolve,reject)=>{
        switch (tipo){
            case "Normal":
                query="SELECT * FROM "+tabla;
                break;
            case "Columna":
                query="SELECT '"+columna+"' FROM"+tabla;
                break;
            case "Unico":
                query = "SELECT * FROM " + tabla + " WHERE " + columna + " = :id";
                break;
        }
        const resultado = await turso.execute({
            sql: query,
            args: { ide:this.id }
        })
        resolve(resultado)

    })
}

function insertarDatos(tabla,values){
    return new Promise(async (resolve,reject)=>{
        const keys = Object.keys(values).join(',');
        const placeholders = Object.keys(values).map(() => '?').join(',');
        const query = `INSERT INTO ${tabla} (${keys}) VALUES(${placeholders})`;
        const vals = Object.values(values);

        const resultado = await turso.execute(query) 
        resolve(resultado)       
    })
}

function actualizarDatos(tabla, valores, condicion) {
    return new Promise(async(resolve, reject) => {

        const keys = Object.keys(valores);
        const placeholders = keys.map(key => `${key} = ?`).join(', ');
        const query = `UPDATE ${tabla} SET ${placeholders}`;

        
        const condKeys = Object.keys(condicion);
        const condPlaceholders = condKeys.map(key => `${key} = ?`).join(' AND ');
        const whereClause = ` WHERE ${condPlaceholders}`;

        // Combinar la consulta con la cláusula WHERE
        const finalQuery = query + whereClause;

        // Obtener los valores del objeto `valores` y las condiciones
        const vals = [...Object.values(valores), ...Object.values(condicion)];

        // Ejecutar la consulta SQL
        
        const resultado = await turso.execute(finalQuery, vals);
        resolve(resultado);
    });
}


// Ruta API para obtener datos
app.get('/api/users', (req, res) => {
    selecionarDatos("usuarios", "Normal", "*", 0)
        .then(data => res.json(data))
        .catch(err => res.status(500).send(err));
});
// app.post('/login', (req, res) => {
//     if (!req.body || Object.keys(req.body).length === 0) {
//         return res.status(400).send('El cuerpo de la solicitud está vacío o no es válido.');
//     }
    
//     const { usuario, password } = req.body;

//     selecionarDatos("usuarios", "Unico", "usuario", usuario)
//         .then(data => {
//             if (data.length === 0) {
//                 return res.status(404).send('Usuario no encontrado.');
//             }

//             const usuarioDB = data[0];

//             if (usuarioDB.usuario === usuario && usuarioDB.password === password) {
                
//                 // Registrar la sesión
//                 req.session.usuarioID = usuarioDB.id;
//                 req.session.usuario = usuarioDB.usuario;
//                 req.session.rol = usuarioDB.rol;
//                 req.session.nombre = usuarioDB.nombre;
//                 res.json({ mensaje: 'Inicio de sesión exitoso', usuario: usuarioDB,exito:true });
//             } else {
//                 res.status(401).send('Credenciales incorrectas.');
//             }
//         })
//         .catch(err => res.status(500).send(err));
// });

app.get('/api/coments',(req,res)=>{
    selecionarDatos("comentarios","Normal","*",0)
        .then(data => res.json(data))
        .catch(err => res.status(500).send(err))
})
app.post('/api/user',(req,res)=>{
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).send('El cuerpo de la solicitud está vacío o no es válido.');
    }
    const values = req.body;
    insertarDatos("usuarios", values)
        .then(data => res.status(201).json({exito: true,data}))
        .catch(err => res.status(500).json({exito: false,error:err.message}));
})
app.post('/api/coment',(req,res)=>{
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).send('El cuerpo de la solicitud está vacío o no es válido.');
    }
    const values = req.body;
    insertarDatos("comentarios", values)
        .then(data => res.status(201).json({exito:true,data}))
        .catch(err => res.status(500).send(err));
})
app.put('/api/user/update',(req,res)=>{
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).send('El cuerpo de la solicitud está vacío o no es válido.');
    }
    const values = req.body;
    const condicion = {
        id:id_user
    }
    actualizarDatos("usuarios",values,condicion)
})

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en ${host_server}`);
});
