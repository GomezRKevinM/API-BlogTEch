const express = require('express');
const cors = require('cors');

const app = express();
const port = 8080;
const mysql = require('mysql');

let query;


let conexion = mysql.createConnection({
    host:process.env.host,
    user:process.env.user,
    password:process.env.password,
    port:process.env.port,
    database:process.env.database
})

app.use(cors());
app.use(express.json());

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
                query="SELECT '"+columna+"' FROM"+tabla;
                break;
            case "Unico":
                query = "SELECT * FROM " + tabla + " WHERE " + columna + " = ?";
                conexion.query(query, [id], (error, lista) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(lista);
                    }
                })
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
        const keys = Object.keys(values).join(',');
        const placeholders = Object.keys(values).map(() => '?').join(',');
        const query = `INSERT INTO ${tabla} (${keys}) VALUES(${placeholders})`;
        const vals = Object.values(values);

        conexion.query(query,vals,(err,lista)=>{
            if(err){
                reject(err)
            }else{
                resolve(lista)
            }
        })
    })
}

function actualizarDatos(tabla, valores, condicion) {
    return new Promise((resolve, reject) => {

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
        conexion.query(finalQuery, vals, (err, resultado) => {
            if (err) {
                reject(err);
            } else {
                resolve(resultado);
            }
        });
    });
}


// Ruta API para obtener datos
app.get('/api/users', (req, res) => {
    selecionarDatos("usuarios", "Normal", "*", 0)
        .then(data => res.json(data))
        .catch(err => res.status(500).send(err));
});
app.post('/login',(req,res)=>{
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).send('El cuerpo de la solicitud está vacío o no es válido.');
    }
    
    const { id, usuario, password, rol, nombre } = req.body;

    selecionarDatos("usuarios", "Unico", "id", id)
        .then(data => {
            if (data.length === 0) {
                return res.status(404).send('Usuario no encontrado.');
            }

            const usuarioDB = data[0];

            // Verificar credenciales
            if (usuarioDB.usuario === usuario && usuarioDB.password === password) {
                res.send(`<h1>Bienvenido ${nombre}, su usuario y contraseña han sido corroborados</h1>`);
            } else {
                res.status(401).send('Credenciales incorrectas.');
            }
        })
        .catch(err => res.status(500).send(err));
})
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
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
