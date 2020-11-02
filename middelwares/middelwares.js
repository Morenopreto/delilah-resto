
const { jwt, tokenKey } = require('../jwt.js');

function validacionExistencia(req, res, next) {
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
function validacionjwt(req, res, next) {
    console.log('valido jwt')
    try {
        const token = req.headers.authorization.split(' ')[1];

        const verificarToken = jwt.verify(token, tokenKey);
        if (verificarToken) {
            req.infoToken = verificarToken;
            console.log('validacionJWT next!')
            return next();
        }
    } catch (error) {

        res.send(error)
    }
    next();

}

function validacionAdmin(req, res, next) {
    console.log('valido admin')
    if (req.infoToken == undefined) {
        res.status(500).send('Debe iniciar sesion para continuar')
    } else {
        const token = req.headers.authorization.split(' ')[1];
        const verificado = jwt.verify(token, tokenKey);
        
        if (verificado.administrador !== 1) {
            
            res.status(400).json('El usuario no posee los permisos de administrardor para la tarea que intenta realizar.');
        } else {
            console.log('paso el middelware')
            next();
        }
    }


}

module.exports = { validacionAdmin,validacionExistencia,validacionjwt };
