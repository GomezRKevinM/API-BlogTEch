const express = require('express');
const cors = require('cors');


const app = express();
const port = 8080;

const mysql = require('mysql')

let query;

let conexion = mysql.createConnection({
    host:process.env.host,
    user:process.env.user,
    password:process.env.password,
    port:process.env.port,
    database:process.env.database
})

conexion.connect((err)=>{
    if(err){
        throw err;
        conexion.end()
    }else{
        console.log("Conexión exitosa")
    }
})

function selecionarDatos(tabla,tipo,columna,id){
    return new Promise((resolve,reject)=>{
        switch (tipo){
            case "Normal":
                query="SELECT * FROM "+tabla;
                break;
            case "Columna":
                query="SELET '"+columna+"' FROM"+tabla;
                break;
            case "Unico":
                query="SELECT * FROM "+tabla+" WHERE "+columna+"="+id;
                break;
        }
        conexion.query(query,(error,lista)=>{
            if(error){
                reject(error)
            }else{
                resolve(lista)
            }
        }) 
    })
}

function insertarDatos(tabla,values){
    return new Promise((resolve,reject)=>{
        const placeholders = values.map(() => '?').join(',');
        query=`INSERT INTO ${tabla} VALUES(${placeholders});`;
        conexion.query(query,(err,lista)=>{
            if(err){
                reject(err)
            }else{
                resolve(lista)
            }
        })
    })
}

app.use(cors());
app.use(express.json());

// Ruta API para obtener datos
app.get('/api/users', (req, res) => {
    selecionarDatos("usuarios", "Normal", "*", 0)
        .then(data => res.json(data))
        .catch(err => res.status(500).send(err));
});
app.get('/api/coments',(req,res)=>{
    selecionarDatos("comentarios","Normal","*",0)
        .then(data => res.json(data))
        .catch(err => res.status(500).send(err))
})
app.post('/api/user',(req,res)=>{
    const values = Object.values(req.body);
    insertarDatos("usuarios",values)
        .then(data => res.status(201).json(data))
        .catch(err => res.status(500).send(err));
})

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
