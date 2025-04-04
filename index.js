import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client'; 
import morgan from 'morgan';
import e from 'express';



dotenv.config()
const corsOptions = {
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
  };

const app = express();
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });
app.use(cors(corsOptions));
app.use(morgan('dev'));
const port = 8080;
const host_server = "https://app-8edf8cb5-03b9-4aaa-b441-2dc3b88977d1.cleverapps.io/";




let query;

export const turso = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN,
});


app.use(express.json());



// Ruta API para obtener datos
app.get('/api/users', async (req, res) => {
    try{
        const query = 'SELECT * FROM usuarios';
        const request = await turso.execute(query)
        .then(data => res.status(200).json({message:"usuarios obtenidos",data:data.rows}))
        .catch(err => res.status(500).json({message:"error",error:err.message}));
        
    }catch(err){
        res.status(500).json({message:"error",error:err.message});
        console.error(err);
    }

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
    try{
        const request = await turso.execute("SELECT * FROM comentarios WHERE post = 0")
        .then(data => res.status(200).json(data.rows))
        .catch(err => res.status(500).send(err));
    }catch(err){
        res.status(500).json({message:"error",error:err.message});
        console.error(err);
    }
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
    try{
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).send('El cuerpo de la solicitud está vacío o no es válido.');
        }
        const values = req.body;
        console.log(values);
        const query = 'INSERT INTO comentarios (usuario,comentario,post) VALUES (:usuario,:comentario,:post)';
        const request = await turso.execute({
            sql: query,
            args:{usuario:values.usuario,comentario:values.comentario,post:values.post}
        });
        if(request.rowsAffected>0){
            res.status(200).json({message:"comentario enviado",data:request.rows,ok:true});
        }else{
            res.status(500).json({message:"error al enviar datos",error:err.message});
        }
    }catch(err){
        res.status(500).json({message:"error",error:err.message});
        console.error(err);
    }

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
app.get('/foro/categorias',async(req,res)=>{
    try{
        const request = await turso.execute("SELECT * FROM categoria")
        .then(data => res.status(200).json(data.rows))
        .catch(err => res.status(500).send(err));
    }
    catch(err){
        res.status(500).json({message:"error",error:err.message});
        console.error(err);
    }
})
app.get('/foro/publicaciones/',async(req,res)=>{
    try{
        const request = await turso.execute("SELECT * FROM publicacion")
        .then(data => res.status(200).json(data.rows))
        .catch(err => res.status(500).send(err));
    }catch(err){
        res.status(500).json({message:"error",error:err.message,ok:false});
        console.error(err);
    }
})
app.get('/foro/publicaciones/:id',async(req,res)=>{
    try{
        req.params.id
        const request = await turso.execute({
            sql:"SELECT * FROM publicacion WHERE id=:id",
            args:{id:req.params.id}
        })
        .then(data => res.status(200).json(data.rows))
        .catch(err => res.status(500).send(err));
    }catch(err){
        res.status(500).json({message:"error",error:err.message,ok:false});
        console.error(err);
    }
})
app.get("/foro/comentarios/:id",async(req,res)=>{
    try{
        const id = req.params.id
        const request = await turso.execute({
            sql:"SELECT * FROM comentarios WHERE post=:id",
            args:{id}
        })
        .then(data => res.status(200).json(data.rows))
        .catch(err => res.status(500).send(err));
    }catch(err){    
        res.status(500).json({message:"error",error:err.message,ok:false});
        console.error(err);
    }
})
app.post("/foro/comentario/",async(req,res)=>{
    try{
        const values = req.body;
        const consultarUsuario = await turso.execute({
            sql:"SELECT * FROM usuarios WHERE username=:username",
            args:{username:values.usuario}
        })
        if(consultarUsuario.rows.length==0){
            return res.status(404).json({message:"usuario no encontrado",ok:false});
        }
        const query = 'INSERT INTO comentarios (usuario,comentario,post,fecha,hora) VALUES (:usuario,:comentario,:post,:fecha,:hora)';
        const request = await turso.execute({
            sql: query,
            args:{usuario:values.usuario,comentario:values.comentario,post:values.post,fecha:values.fecha,hora:values.hora}
        });
        if(request.rowsAffected>0){
            const update = await turso.execute({
                sql:"UPDATE publicacion SET comentarios=comentarios+1 WHERE id=:id",
                args:{id:values.post}
            })
            res.status(200).json({message:"comentario enviado",data:request.rows,ok:true});
        }else{
            res.status(500).json({message:"error al enviar datos",error:err.message});
        }
    }catch(err){
        res.status(500).json({message:"error",error:err.message,ok:false});
        console.error(err);
    }
    
})
app.post("/foro/likes",async(req,res)=>{
    try{
        const values = req.body;
        const consultarUsuario = await turso.execute({
            sql:"SELECT * FROM usuario WHERE username=:username",
            args:{username:values.usuario}
        })
        if(consultarUsuario.rows.length==0){
            return res.status(404).json({message:"usuario no encontrado",ok:false});
        }
        const query = 'INSERT INTO likes (usuario,post) VALUES (:usuario,:post)';
        const request = await turso.execute({
            sql: query,
            args:{usuario:values.usuario,post:values.post}
        });
        if(request.rowsAffected>0){
            const update = await turso.execute({
                sql:"UPDATE publicacion SET likes=likes+1 WHERE id=:id",
                args:{id:values.post}
            })
            res.status(200).json({message:"like enviado",data:request.rows,ok:true});
        }else{
            res.status(500).json({message:"error al enviar datos",error:err.message});
        }
    }catch(err){
        res.status(500).json({message:"error",error:err.message,ok:false});
        console.error(err);
    }
})
app.post("/foro/dislike",async(req,res)=>{
    try{
        const values = req.body;        
        const update = await turso.execute({
            sql:"UPDATE publicacion SET likes=likes-1 WHERE id=:id",
            args:{id:values.post}
        })
        const request = await turso.execute({
            sql:"DELETE FROM likes WHERE usuario=:usuario AND post=:post",
            args:{usuario:values.usuario,post:values.post}
        });
        if(request.rowsAffected>0){
            res.status(200).json({message:"dislike enviado",data:request.rows,ok:true});
        }else{
            res.status(500).json({message:"error al enviar datos",error:err.message});
        }
    }catch(err){
        res.status(500).json({message:"error",error:err.message,ok:false});
        console.error(err);
    }
})

app.post("/foro/userLikes",async(req,res)=>{
    try{
        const request = await turso.execute({
            sql:"SELECT * FROM likes WHERE usuario=:usuario",
            args:{usuario:req.body.usuario}
        })
        .then(data => res.status(200).json(data.rows))
        .catch(err => res.status(500).send(err));
    }catch(err){    
        res.status(500).json({message:"error",error:err.message,ok:false});
        console.error(err);    
    }
})
app.get("/foro/post/:id/likes",async(req,res)=>{
    try{
        const id = req.params.id
        const request = await turso.execute({
            sql:"SELECT * FROM likes WHERE post=:id",
            args:{id}
        })
        .then(data => res.status(200).json(data.rows))
        .catch(err => res.status(500).send(err));
    }catch(err){    
        res.status(500).json({message:"error",error:err.message,ok:false});
        console.error(err);
    }
})
app.post("/foro/like/:id/delete",async(req,res)=>{
    try{
        const id = req.params.id
        const request = await turso.execute({
            sql:"DELETE FROM likes WHERE id=:id",
            args:{id}
        })
        .then(data => res.status(200).json(data.rows))
        .catch(err => res.status(500).send(err));
    }catch(err){    
        res.status(500).json({message:"error",error:err.message,ok:false});
        console.error(err);
    }
})
// autenticaciones

app.post("/login/autenticacion",async(req,res)=>{
    try{
        const datos = req.body;
        console.log('datos recibidos: ',datos);
        const request = await turso.execute({
            sql:"SELECT * FROM usuario WHERE username = :usuario AND password = :password",
            args:{
                usuario:datos.username,
                password:datos.password
            }
        })
        .then(data => res.status(200).json({exito:true,data:data.rows,message:"login exitoso",ok:true}))
        .catch(err => res.status(500).send(err));
        
    }catch(err){    
        res.status(500).json({message:"error",error:err.message,ok:false});
        console.error(err);
    }
})

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en ${host_server}`);
});
