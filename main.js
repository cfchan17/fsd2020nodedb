//imports
const express = require('express')
const mysql = require('mysql2/promise')
const handlebars = require('express-handlebars')

//configure app port
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

//create an instance of the app
const app = express()

//configure and set the template engine
app.engine('hbs', handlebars({defaultLayout: 'default.hbs'}))
app.set('view engine', 'hbs')

//SQL Query constant
const SQL_FIND_BY_NAME = 'select * from apps where name like ? limit ? offset ?;'

//MySQL Connection Pool settings
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'playstore',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 5,
    timezone: '+08:00'
})

//Query Database
const retrieveFromDb = async (appName, offsetNum) => {
    const conn = await pool.getConnection()
    try {
        const result = await conn.query(SQL_FIND_BY_NAME, [`%${appName}%`, 20, offsetNum])
        return result
    }
    catch(e) {
        console.error('Error: %s', e)
    }
    finally {
        conn.release()
    }
}

//Routing
app.get('/', (req, res) => {
    res.status(200)
    res.type('text/html')
    res.render('index')
})

app.get('/nextPage', (req, res) => {
    const appName = req.query.appName
    const offset = parseInt(req.query.currentOffset) + 20
    const dbCall = retrieveFromDb(appName, offset)
    dbCall.then(result => {
        res.status(200)
        res.type('text/html')
        res.render('result', {
            result: result[0],
            offset,
            appName
        })
    })
})

app.get('/prevPage', (req, res) => {
    const appName = req.query.appName
    const offset = parseInt(req.query.currentOffset) - 20
    if(offset < 0) {
        const newOffset = 0
        const dbCall = retrieveFromDb(appName, newOffset)
        dbCall.then(result => {
            res.status(200)
            res.type('text/html')
            res.render('result', {
                result: result[0],
                offset: newOffset,
                appName
            })
        })
    }
    else {
        const dbCall = retrieveFromDb(appName, offset)
        dbCall.then(result => {
            res.status(200)
            res.type('text/html')
            res.render('result', {
                result: result[0],
                offset,
                appName
            })
        })
    }
    
})

app.get('/retrieve', (req, res) => {
    const appName = req.query.appName
    const dbCall = retrieveFromDb(appName, 0)
    dbCall.then(result => {
        res.status(200)
        res.type('text/html')
        res.render('result', {
            result: result[0],
            offset: 0,
            appName
        })
    })
})

//Start the app if can ping the database
const startApp = async (app, pool) => {
    try{
        const conn = await pool.getConnection()
        await conn.ping()

        conn.release()
        app.listen(PORT, () => {
            console.info(`App has started on ${PORT} at ${new Date()}`)
        })
    }
    catch(exception) {
        console.error('Database error: %s', exception)
    }
}

startApp(app, pool)