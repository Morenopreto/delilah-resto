const express = require('express');
let router = express.Router();
const { jwt, tokenKey } = require('../jwt.js');
const { validacionAdmin, validacionjwt } = require('../middelwares/middelwares')
const sequelize = require('../seq-conexion.js');

router
    .route('/')
    .post(validacionjwt, (req, res) => {

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
    .get(validacionjwt, validacionAdmin, async (req, res) => {
        console.log('entro')
        const pedidosTotales = [];
        let pedidoIterado = [];
        try {
            const pedidos = await sequelize.query('SELECT pedidos.order_id FROM pedidos inner JOIN estado_pedidos ON pedidos.order_id = estado_pedidos.order_id WHERE estado_pedidos.estado_id < 6',
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
router
    .route('/:order_id')
    .get(validacionjwt, async (req, res) => {
        const token = req.headers.authorization.split(' ')[1];
        const verificarToken = jwt.verify(token, tokenKey);
        const order_id = req.params.order_id;
        try {

            if (verificarToken.administrador === 0) {

                const pedido = await sequelize.query('SELECT  pedidos.order_id, sum(productos.precio*productos_pedidos.quantity) as precio_total, pedidos.metodo_pago, pedidos.direccion, usuarios.nombrecompleto, usuarios.usuario_id, estados.estado_pedido, estado_pedidos.estado_id FROM `pedidos` INNER JOIN `usuarios` ON pedidos.usuario_id = usuarios.usuario_id INNER JOIN `estado_pedidos` ON estado_pedidos.order_id = pedidos.order_id INNER JOIN `productos_pedidos` ON productos_pedidos.order_id = pedidos.order_id INNER JOIN `productos` ON productos.producto_id = productos_pedidos.producto_id INNER JOIN `estados` ON estado_pedidos.estado_id = estados.estado_id  WHERE pedidos.order_id = ? AND usuarios.usuario_id = ? GROUP BY pedidos.order_id',
                    {
                        replacements: [order_id, verificarToken.usuario_id],
                        type: sequelize.QueryTypes.SELECT
                    })
                console.log(pedido)
                console.log('pedido.length')
                console.log(pedido.length)
                if (pedido.length) {

                    if (pedido[0].estado_id != 6) {
                        console.log('Entro porque el pedido no estaba eliminado')

                        const productosPedidos = await sequelize.query('SELECT productos.nombre_producto, productos.descripcion, productos_pedidos.quantity, productos.precio, (productos.precio*productos_pedidos.quantity) as precio_total FROM `productos` INNER JOIN `productos_pedidos` ON productos_pedidos.producto_id = productos.producto_id WHERE productos_pedidos.order_id = ?',
                            {
                                replacements: [order_id],
                                type: sequelize.QueryTypes.SELECT
                            }
                        )
                        const respuesta = [pedido, productosPedidos];


                        res.status(200).json(respuesta);


                    } else {
                        res.status(500).json(`El order id: ${order_id} se encuentra en estado eliminado`)
                    }
                } else {
                    res.status(500).json('El numero de pedido no corresponde al cliente')


                }

            } else {
                const pedido = await sequelize.query('SELECT  pedidos.order_id, sum(productos.precio*productos_pedidos.quantity) as precio_total, pedidos.metodo_pago, pedidos.direccion, usuarios.nombrecompleto, usuarios.usuario_id, estados.estado_pedido, estado_pedidos.estado_id FROM `pedidos` INNER JOIN `usuarios` ON pedidos.usuario_id = usuarios.usuario_id INNER JOIN `estado_pedidos` ON estado_pedidos.order_id = pedidos.order_id INNER JOIN `productos_pedidos` ON productos_pedidos.order_id = pedidos.order_id INNER JOIN `productos` ON productos.producto_id = productos_pedidos.producto_id INNER JOIN `estados` ON estado_pedidos.estado_id = estados.estado_id  WHERE pedidos.order_id = ?  GROUP BY pedidos.order_id',
                    {
                        replacements: [order_id],
                        type: sequelize.QueryTypes.SELECT
                    })

                if (pedido.length) {
                    if (pedido[0].estado_id != 6) {
                        const productosPedidos = await sequelize.query('SELECT productos.nombre_producto, productos.descripcion, productos_pedidos.quantity, productos.precio, (productos.precio*productos_pedidos.quantity) as precio_total FROM `productos` INNER JOIN `productos_pedidos` ON productos_pedidos.producto_id = productos.producto_id WHERE productos_pedidos.order_id = ?',
                            {
                                replacements: [order_id],
                                type: sequelize.QueryTypes.SELECT
                            }
                        )
                        const respuesta = [pedido, productosPedidos];

                        res.status(200).json(respuesta);
                    } else {
                        res.status(500).json(`El order id: ${order_id} se encuentra en estado eliminado`)

                    }
                } else {
                    res.status(500).json('No existe el order_id seleccionado')
                }
            }

        } catch (error) {
            res.status(400).send(error)
        }

    })
    .patch(validacionjwt, validacionAdmin, async (req, res) => {

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
                res.status(400).send(error);
            }

        }
        else {
            res.status(500).json('Solo hay 5 estados');
        }

    })
    .delete(validacionjwt, validacionAdmin, async (req, res) => {

        const { eliminado } = req.query
        let eliminadoBool = JSON.parse(eliminado.toLowerCase());
        const { order_id } = req.params;

        if (eliminadoBool === true) {
            try {
                let chequeoOrder = await sequelize.query('SELECT * FROM pedidos WHERE order_id = ?',
                    {
                        replacements: [order_id],
                        type: sequelize.QueryTypes.SELECT
                    })
                if (!!chequeoOrder.length) {
                    await sequelize.query('UPDATE `estado_pedidos` SET estado_id = ? WHERE order_id = ?',
                        {
                            replacements: [6, order_id],
                            type: sequelize.QueryTypes.UPDATE
                        })

                    res.status(200).json(`Order ID: ${order_id} modificado a estado: CANCELADO`)
                }
                else {

                    res.status(500).json(`Orden ID: ${order_id} no existe.`)
                }


            } catch (error) {
                console.log('catch')
                res.status(400).send(error);
            }

        }
        else {
            res.status(500).json('Parametro esperado eliminado=true');
        }

    })




module.exports = router;