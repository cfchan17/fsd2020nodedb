const express = require('express')
const mysql2 = require('mysql2')
const handlebars = require('express-handlebars')

const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

const app = express()

app.engine('hbs', handlebars({defaultLayout: 'default.hbs'}))
app.set('view engine', 'hbs')

const pool = mysql2.createPool({
    host: 'localhost',
    port: 3306,
    user: 'fred',
    password: 'fred',
    database: 'playstore',
    waitForConnections: true,
    connectionLimit: 5
})

const retrieveTenRows = () => {
    pool.getConnection((error, connection) => {
        if(error) {
            return
        }
        connection.query('select * from apps limit 10', (error, result) => {
            if(error) {
                console.log('error %s', error)
            }
            console.info(result)
        })
    })
}

app.use('/', (req, res) => {
    retrieveTenRows()
    res.status(200)
    res.type('text/html')
    res.render('index')
})

app.listen(PORT, () => {
    console.info(`App has started on ${PORT} at ${new Date()}`)
})