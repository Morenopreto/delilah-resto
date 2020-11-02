const Sequelize = require('sequelize');
const sequelize = new Sequelize('mysql://root@localhost:3306/delilahResto', { operatorsAliases: 0 });


module.exports = sequelize;

