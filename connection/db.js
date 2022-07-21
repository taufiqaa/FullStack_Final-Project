const {Pool} = require('pg')

//setUpConnection
const dbPool = new Pool({
    database: 'personal_db',
    port: 5432,
    user:'postgres',
    password:'Taufiq1234567',
})

module.exports = dbPool