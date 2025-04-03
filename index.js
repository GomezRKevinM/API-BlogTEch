import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';  


dotenv.config()
const corsOptions = {
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
  };

const app = express();
const port = 8080;
const host_server = "https://app-8edf8cb5-03b9-4aaa-b441-2dc3b88977d1.cleverapps.io/";

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });


let query;

export const turso = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN,
});


app.use(express.json());



// Ruta API para obtener datos
app.get('/api/users', async (req, res) => {
    const query = 'SELECT * FROM usuarios';
    const request = await turso.query(query);
    const data = await request.all();
    res.status(200).json({message:"ok",data});
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

app.get('/api/coments',async (req,res)=>{
    const query = 'SELECT * FROM comentarios';
    const request = await turso.query(query);
    const data = await request.all();
    res.status(200).json({message:"ok",data:data,ok:true});
})
app.post('/api/user',async (req,res)=>{
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).send('El cuerpo de la solicitud está vacío o no es válido.');
    }
    const values = req.body;
    insertarDatos("usuarios", values)
        .then(data => res.status(201).json({exito: true,data}))
        .catch(err => res.status(500).json({exito: false,error:err.message}));
})
app.post('/api/coment',async(req,res)=>{
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).send('El cuerpo de la solicitud está vacío o no es válido.');
    }
    const values = req.body;
    const query = 'INSERT INTO comentarios (comentario) VALUES (?)';
    const request = await turso.query(query);
    const data = await request.run(values.comentario);
    res.status(200).json({message:"ok",data:data,ok:true});
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
