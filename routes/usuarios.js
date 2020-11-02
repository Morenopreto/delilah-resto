const express = require('express');
let router = express.Router();
const { jwt, tokenKey } = require('../jwt.js');
const { validacionExistencia, validacionjwt } = require('../middelwares/middelwares')
const sequelize = require('../seq-conexion.js');



router.post('/', validacionExistencia, (req, res) => {
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
router.post('/login', (req, res) => {
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
                // infoToken = jwt.sign(privado, tokenKey, { expiresIn: '1h' });
                req.infoToken = jwt.sign(privado, tokenKey, { expiresIn: '1h' });
                res.status(200).json(`${req.infoToken}`)
            } else {

                res.status(400).json(`El usuario o la contrasena ingresadas son incorrectos`)

            }
        } catch (error) {
            console.log(error)
            res.status(404).json('El usuario ingresado no existe.')
        }

    })()

})
router.get('/:usuario_id', validacionjwt, (req, res) => {

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


module.exports = router;