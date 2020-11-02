
const { jwt, tokenKey } = require('./jwt.js');





// module.exports = {
    
//     // validacionExistencia: (req, res, next) => {
//     //     (async () => {
//     //         let table = `usuarios`;
//     //         let param = `usuario`;
//     //         let usuarios = await sequelize.query(`SELECT * FROM ${table} WHERE ${param} = '${req.body.usuario}'`, { type: sequelize.QueryTypes.SELECT })
//     //         if (!!usuarios.length) {
//     //             res.json(`El nombre de usuario que intenta agregar ya existe.`)//abria que mandar status 400??
//     //         } else {
//     //             next();
//     //         }
//     //     })()
    
//     // },
//     validacionjwt: (req, res, next) => {
//         // la validacion de admin deberia ser contra el JWT??
//         if (infoToken == undefined) {
//             res.status(500).send('Debe iniciar sesion para continuar')
//         } else {
//             try {
//                 const token = req.headers.authorization.split(' ')[1];
    
//                 const verificarToken = jwt.verify(token, tokenKey);
//                 if (verificarToken) {
//                     req.usuario = verificarToken;
//                     return next();
//                 }
//             } catch (error) {
    
//                 res.send(error);
//             }
//             next();
//         }
    
//     }

// }



function validacionAdmin (req, res, next){
    console.log('llego a validacionADMIN')
    // if (req.infoToken == undefined) {
    //     res.status(500).send('Debe iniciar sesion para continuar')
    // } else {
    //     const token = req.headers.authorization.split(' ')[1];
    //     const verificado = jwt.verify(token, tokenKey);
    //     console.log('verificado');
    //     console.log(verificado);
    //     if (verificado.administrador !== 1) {
    //         console.log('va a dar error entro por if')
    //         res.status(400).json('El usuario no posee los permisos de administrardor para la tarea que intenta realizar.');
    //     } else {
    //         console.log('paso el middelware')
    //         next();
    //     }
    // }


}
validacionAdmin()
// export default {validacionExistencia,validacionAdmin,validacionjwt};
module.exports = {validacionAdmin};