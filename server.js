
const express = require('express');
const app = express();

const port = 3000;

const pedidosRoute = require('./routes/pedidos')
const productosRoute = require('./routes/productos')
const usuariosRoute = require('./routes/usuarios')

app.use(express.json());

app.listen(port, () => {
    console.log(`App corriendo en puerto ${port}`);
})

const sequelize = require('./seq-conexion.js');


app.use('/usuarios', usuariosRoute);
app.use('/pedidos', pedidosRoute);
app.use('/productos', productosRoute);


