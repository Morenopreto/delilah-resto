const express = require('express');
let router = express.Router();
const { validacionAdmin, validacionjwt } = require('../middelwares/middelwares')
const sequelize = require('../seq-conexion.js');

router
    .route('/')
    .get(validacionjwt, (req, res) => {

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
    .post(validacionjwt, validacionAdmin, async (req, res) => {
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
router
    .route('/:producto_id')
    .patch(validacionjwt, validacionAdmin, async (req, res) => {
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
    .delete(validacionjwt, validacionAdmin, async (req, res) => {
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

module.exports = router;