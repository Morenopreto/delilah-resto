// const { EILSEQ } = require('constants');
const express = require('express');
const app = express();
const sequelize = require('./seq-conexion.js');
let infoToken;
const {jwt, tokenKey} = require('./jwt.js');
const port = 3000;


app.use(express.json());

app.listen(port, () => {
    console.log(`App corriendo en puerto ${port}`);
})





////////////////////////////////////////////////////MIDDLEWARES
//valida si existe el usuario o no
const validacionExistencia = (req, res, next) => {
    (async () => {
        let table = `usuarios`;
        let param = `usuario`;
        let usuarios = await sequelize.query(`SELECT * FROM ${table} WHERE ${param} = '${req.body.usuario}'`, { type: sequelize.QueryTypes.SELECT })
        if (!!usuarios.length) {
            res.json(`El nombre de usuario que intenta agregar ya existe.`)//abria que mandar status 400??
        } else {
            next();
        }
    })()

}

const validacionjwt = (req, res, next) => {
    // la validacion de admin deberia ser contra el JWT??
    if (infoToken == undefined) {
        res.status(500).send('Debe iniciar sesion para continuar')
    } else {
        try {
            const token = req.headers.authorization.split(' ')[1];

            const verificarToken = jwt.verify(token, tokenKey);
            if (verificarToken) {
                req.usuario = verificarToken;
                return next();
            }
        } catch (error) {

            res.send(error);
        }
        next();
    }

}

const validacionAdmin = (req, res, next) => {

    if (infoToken == undefined) {
        res.status(500).send('Debe iniciar sesion para continuar')
    } else {
        const verificado = jwt.verify(infoToken, tokenKey);
        if (verificado.administrador !== 1) {
            res.status(400).json('El usuario no posee los permisos de administrardor para la tarea que intenta realizar.');
        } else {
            next();
        }
    }


}

///////////////////////////////////////// ENDPOINTS
//////// PATH ----------- USUARIOS -----------------------
app.post('/usuarios', validacionExistencia, (req, res) => {
    const { nombrecompleto, mail, direccion, telefono, administrador, usuario, contrasena } = req.body;

    if (!nombrecompleto || !mail || !direccion || !usuario || !contrasena || !telefono) {
        res.status(400).json('Los campos Nombre y Apellido, mail, direccion, Contrasena y Nombre de usuario son obligatorios.');
    } else {
        (async () => {
            try {
                await sequelize.query('INSERT INTO `usuarios` (nombrecompleto, mail, direccion,telefono,usuario,contrasena,administrador) VALUES ( ?, ?, ?, ?, ?, ?, ?)',
                    {
                        replacements: [nombrecompleto, mail, direccion, telefono, usuario, contrasena, 0],
                        type: sequelize.QueryTypes.INSERT

                    })
                res.status(200).json(`Usuario ${req.body.usuario} agregado correctamente.`);
            } catch (error) {
                res.status(500).send(error);
            }
        })()

    }

})

app.post('/usuarios/login', (req, res) => {
    const { usuario, contrasena } = req.body;

    (async () => {
        let usuarioDes;

        try {
            let usuarios = await sequelize.query(`SELECT * FROM usuarios WHERE usuario = '${usuario}'`, { type: sequelize.QueryTypes.SELECT });
            [usuarioDes] = usuarios;
            if (usuarioDes.usuario === usuario && usuarioDes.contrasena === contrasena) {
                let privado = {
                    "usuario_id": usuarioDes.usuario_id,
                    "nombrecompleto": usuarioDes.nombrecompleto,
                    "mail": usuarioDes.mail,
                    "administrador": usuarioDes.administrador,
                    "usuario": usuarioDes.usuario
                }
                infoToken = jwt.sign(privado, tokenKey, { expiresIn: '1h' });
                res.status(200).json(`${infoToken}`)
            } else {

                res.status(400).json(`El usuario o la contrasena ingresadas son incorrectos`)

            }
        } catch (error) {
            console.log(error)
            res.status(404).json('El usuario ingresado no existe.')
        }

    })()

})

app.get('/usuarios/:usuario_id', validacionjwt, (req, res) => {

    const token = req.headers.authorization.split(' ')[1];
    const verificarToken = jwt.verify(token, tokenKey);

   
    if (verificarToken.usuario_id != req.params.usuario_id) {
        return res.status(400).json('No tiene acceso al parametro que busca, revise su informacion de inicio de sesion.')
    } else {
        try {
            (async () => {
                let usuario = await sequelize.query(`SELECT usuario_id,nombrecompleto, mail,direccion,administrador,telefono,usuario FROM usuarios WHERE usuario_id = "${verificarToken.usuario_id}"`, { type: sequelize.QueryTypes.SELECT })
                console.log(usuario[0]);
                return res.status(200).json(usuario[0]);
            })()


        } catch (error) {
            return res.status(500).send(error);
        }
    }



})

//////// PATH ----------- PRODUCTOS -----------------------

app.get('/productos', validacionjwt, (req, res) => {

    try {
        (async () => {
            let productos = await sequelize.query(`SELECT * FROM productos WHERE active = 1`,
                { type: sequelize.QueryTypes.SELECT })
            console.log(productos);
            return res.status(200).json(productos);
        })();
    } catch (error) {
        return res.status(500).send(error);
    }
})
app.post('/productos', validacionjwt, validacionAdmin, async (req, res) => {
    const { nombre_producto, descripcion, precio, Img_url } = req.body;
    try {
        const productoExiste = await sequelize.query('SELECT * FROM productos WHERE nombre_producto = ?',
            {
                replacements: [nombre_producto],
                type: sequelize.QueryTypes.SELECT
            })
        if (!!productoExiste.length) {
            res.status(400).json(`El nombre del producto que quiere crear ya existe y se encuentra ${(productoExiste[0].producto_id == 0) ? 'Desactivado' : 'Activo'}. INFO: id: ${productoExiste[0].producto_id}, nombre:${productoExiste[0].nombre_producto} `);
        }

        await sequelize.query(`INSERT INTO productos (nombre_producto, descripcion, precio ,Img_url,active) VALUES (?,?,?,?,?);`,
            {
                replacements: [nombre_producto, descripcion, precio, Img_url, 1],
                type: sequelize.QueryTypes.INSERT
            })
        res.status(200).json("Producto creado correctamente")
    } catch (error) {
        res.status(500).send(error);
    }


})
app.patch('/productos/:producto_id', validacionjwt, validacionAdmin, async (req, res) => {
    const { nombre_producto, descripcion, precio, Img_url } = req.body;
    const producto_id = req.params.producto_id;
    try {
        let chequeoOrder = await sequelize.query('SELECT * FROM productos WHERE producto_id = ?',
            {
                replacements: [producto_id],
                type: sequelize.QueryTypes.SELECT
            })
        if (!!chequeoOrder.length) {
            if (nombre_producto) {
                await sequelize.query('UPDATE `productos` SET nombre_producto = ? WHERE producto_id = ?',
                    {
                        replacements: [nombre_producto, producto_id],
                        type: sequelize.QueryTypes.UPDATE
                    })

            }
            if (descripcion) {
                await sequelize.query('UPDATE `productos` SET descripcion = ? WHERE producto_id = ?',
                    {
                        replacements: [descripcion, producto_id],
                        type: sequelize.QueryTypes.UPDATE
                    })

            }
            if (precio) {
                await sequelize.query('UPDATE `productos` SET precio = ? WHERE producto_id = ?',
                    {
                        replacements: [precio, producto_id],
                        type: sequelize.QueryTypes.UPDATE
                    })

            }
            if (Img_url) {
                await sequelize.query('UPDATE `productos` SET Img_url = ? WHERE producto_id = ?',
                    {
                        replacements: [Img_url, producto_id],
                        type: sequelize.QueryTypes.UPDATE
                    })

            }
            res.status(200).json(`El producto con id ${producto_id} se modifico de manera correcta.`)
        }
        else {
            res.status(500).json(`producto_id: ${producto_id} no existe.`)
        }
    } catch (error) {
        res.status(500).send(error.original.sqlMessage);
    }

})
app.delete('/productos/:producto_id', validacionjwt, validacionAdmin, async (req, res) => {
    const { active } = req.query
    let activeBool = JSON.parse(active.toLowerCase());
    const { producto_id } = req.params;
    const actDesact = (activeBool) ? 1 : 0;
    try {
        let chequeoOrder = await sequelize.query('SELECT * FROM productos WHERE producto_id = ?',
            {
                replacements: [producto_id],
                type: sequelize.QueryTypes.SELECT
            })

        if (!!chequeoOrder.length) {
            console.log('entro')

            await sequelize.query('UPDATE `productos` SET active = ? WHERE producto_id = ?',
                {
                    replacements: [actDesact, producto_id],
                    type: sequelize.QueryTypes.UPDATE
                })


            res.status(200).json(`El producto con id ${producto_id} fue ${(activeBool) ? 'activado' : 'desactivado'}.`)
        }
        else {
            res.status(500).json(`producto_id: ${producto_id} no existe.`)
        }
    } catch (error) {
        res.status(500).json(error);
    }

})


//////// PATH ----------- PEDIDOS -----------------------

app.post('/pedidos', validacionjwt, (req, res) => {

    const { metodo_pago } = req.query;
    const pedido = req.body;
    const token = req.headers.authorization.split(' ')[1];
    const verificarToken = jwt.verify(token, tokenKey);

    (async () => {
        try {

            let direccionObj = await sequelize.query(`SELECT direccion from usuarios WHERE usuario_id = ${verificarToken.usuario_id} `,
                { type: sequelize.QueryTypes.SELECT });
            let direccion = direccionObj[0].direccion

            await sequelize.query('INSERT INTO `pedidos` (metodo_pago, direccion, usuario_id ) VALUES ( ?, ?, ?)',
                {
                    replacements: [metodo_pago, direccion, verificarToken.usuario_id],
                    type: sequelize.QueryTypes.INSERT
                });
            let order_idObj = await sequelize.query(`SELECT @@identity AS order_id from pedidos WHERE usuario_id = ${verificarToken.usuario_id} `,
                { type: sequelize.QueryTypes.SELECT })
            let order_id = order_idObj[0].order_id;
            
            for await (const element of pedido) {

                sequelize.query('INSERT INTO `productos_pedidos` (order_id, producto_id, quantity) VALUES ( ?, ?, ?)',
                    {
                        replacements: [order_id, element.producto_id, element.quantity],
                        type: sequelize.QueryTypes.INSERT

                    })
            }

           
            await sequelize.query('INSERT INTO `estado_pedidos` (order_id, estado_id) VALUES (?, ?)',
                {
                    replacements: [order_id, 1],
                    type: sequelize.QueryTypes.INSERT

                })
            res.status(200).json(`Pedido nuevo agregado correctamente. order_id: ${order_id}`);
        } catch (error) {
            res.status(500).send(error);;
        }
    })()


})
app.get('/pedidos', validacionjwt, validacionAdmin, async (req, res) => {
    const pedidosTotales = [];
    let pedidoIterado = [];
    try {
        const pedidos = await sequelize.query('SELECT pedidos.order_id FROM pedidos',
            {
                type: sequelize.QueryTypes.SELECT
            })
        console.log(pedidos)
        for (const order of pedidos) {

            const pedido = await sequelize.query('SELECT  pedidos.order_id, sum(productos.precio*productos_pedidos.quantity) as precio_total, pedidos.metodo_pago, pedidos.direccion, usuarios.nombrecompleto, usuarios.usuario_id, estados.estado_pedido FROM `pedidos` INNER JOIN `usuarios` ON pedidos.usuario_id = usuarios.usuario_id INNER JOIN `estado_pedidos` ON estado_pedidos.order_id = pedidos.order_id INNER JOIN `productos_pedidos` ON productos_pedidos.order_id = pedidos.order_id INNER JOIN `productos` ON productos.producto_id = productos_pedidos.producto_id INNER JOIN `estados` ON estado_pedidos.estado_id = estados.estado_id  WHERE pedidos.order_id = ? GROUP BY pedidos.order_id',
                {
                    replacements: [order.order_id],
                    type: sequelize.QueryTypes.SELECT
                })

            pedidoIterado.push(pedido);
            if (pedido.length) {
                const productosPedidos = await sequelize.query('SELECT productos.nombre_producto, productos.descripcion, productos_pedidos.quantity, productos.precio, (productos.precio*productos_pedidos.quantity) as precio_total FROM `productos` INNER JOIN `productos_pedidos` ON productos_pedidos.producto_id = productos.producto_id WHERE productos_pedidos.order_id = ?',
                    {
                        replacements: [order.order_id],
                        type: sequelize.QueryTypes.SELECT
                    }
                )

                pedidoIterado.push(productosPedidos);
            }
            pedidosTotales.push(pedidoIterado);
            pedidoIterado = [];
        }

        res.status(200).json(pedidosTotales);

    } catch (error) {
        res.status(500).send(error)
    }


})
app.get("/pedidos/:order_id", validacionjwt, async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const verificarToken = jwt.verify(token, tokenKey);
    const order_id = req.params.order_id;
    try {

        if (verificarToken.administrador === 0) {

            const pedido = await sequelize.query('SELECT  pedidos.order_id, sum(productos.precio*productos_pedidos.quantity) as precio_total, pedidos.metodo_pago, pedidos.direccion, usuarios.nombrecompleto, usuarios.usuario_id, estados.estado_pedido FROM `pedidos` INNER JOIN `usuarios` ON pedidos.usuario_id = usuarios.usuario_id INNER JOIN `estado_pedidos` ON estado_pedidos.order_id = pedidos.order_id INNER JOIN `productos_pedidos` ON productos_pedidos.order_id = pedidos.order_id INNER JOIN `productos` ON productos.producto_id = productos_pedidos.producto_id INNER JOIN `estados` ON estado_pedidos.estado_id = estados.estado_id  WHERE pedidos.order_id = ? AND usuarios.usuario_id = ? GROUP BY pedidos.order_id',
                {
                    replacements: [order_id, verificarToken.usuario_id],
                    type: sequelize.QueryTypes.SELECT
                })
            if (pedido.length) {
                const productosPedidos = await sequelize.query('SELECT productos.nombre_producto, productos.descripcion, productos_pedidos.quantity, productos.precio, (productos.precio*productos_pedidos.quantity) as precio_total FROM `productos` INNER JOIN `productos_pedidos` ON productos_pedidos.producto_id = productos.producto_id WHERE productos_pedidos.order_id = ?',
                    {
                        replacements: [order_id],
                        type: sequelize.QueryTypes.SELECT
                    }
                )
                const respuesta = [pedido, productosPedidos];

                res.status(200).json(respuesta);
            } else {
                res.status(500).json('El numero de pedido no corresponde al cliente')
            }
        } else {
            const pedido = await sequelize.query('SELECT  pedidos.order_id, sum(productos.precio*productos_pedidos.quantity) as precio_total, pedidos.metodo_pago, pedidos.direccion, usuarios.nombrecompleto, usuarios.usuario_id, estados.estado_pedido FROM `pedidos` INNER JOIN `usuarios` ON pedidos.usuario_id = usuarios.usuario_id INNER JOIN `estado_pedidos` ON estado_pedidos.order_id = pedidos.order_id INNER JOIN `productos_pedidos` ON productos_pedidos.order_id = pedidos.order_id INNER JOIN `productos` ON productos.producto_id = productos_pedidos.producto_id INNER JOIN `estados` ON estado_pedidos.estado_id = estados.estado_id  WHERE pedidos.order_id = ?  GROUP BY pedidos.order_id',
                {
                    replacements: [order_id],
                    type: sequelize.QueryTypes.SELECT
                })
            if (pedido.length) {
                const productosPedidos = await sequelize.query('SELECT productos.nombre_producto, productos.descripcion, productos_pedidos.quantity, productos.precio, (productos.precio*productos_pedidos.quantity) as precio_total FROM `productos` INNER JOIN `productos_pedidos` ON productos_pedidos.producto_id = productos.producto_id WHERE productos_pedidos.order_id = ?',
                    {
                        replacements: [order_id],
                        type: sequelize.QueryTypes.SELECT
                    }
                )
                const respuesta = [pedido, productosPedidos];
                res.status(200).json(respuesta);
            } else {
                res.status(500).json('No existe el order_id seleccionado')
            }
        }

    } catch (error) {
        res.status(400).send(error)
    }

})
app.patch('/pedidos/:order_id', validacionjwt, validacionAdmin, async (req, res) => {

    const { new_estado_id } = req.query;
    const order_id = req.params.order_id;


    if (new_estado_id > 0 && new_estado_id < 6) {
        try {

            let chequeoOrder = await sequelize.query('SELECT * FROM pedidos WHERE order_id = ?',
                {
                    replacements: [order_id],
                    type: sequelize.QueryTypes.SELECT
                })
            if (!!chequeoOrder.length) {
                await sequelize.query('UPDATE `estado_pedidos` SET estado_id = ? WHERE order_id = ?',
                    {
                        replacements: [new_estado_id, order_id],
                        type: sequelize.QueryTypes.UPDATE
                    })

                res.status(200).json(`Order ID: ${order_id} modificado a estado: ${new_estado_id}`)
            }
            else {

                res.status(500).json(`Orden ID: ${order_id} no existe.`)
            }


        } catch (error) {
            console.log('catch')
            res.status(400).send(error.original.sqlMessage);
        }

    }
    else {
        res.status(500).json('Solo hay 5 estados');
    }

})


