
var express = require('express')
var router = express.Router()
var path = require('path')

const db = require('../utils/db')

let client
const dbc = db()

dbc.getDb().then((dbconnection) => {
  client = dbconnection

  client.on('error', (err) => {
    console.log('DB connection failure ... aborting', err)
    process.exit(1)
  })
})

/* GET home page. */
router.get('/', async (req, res, next) => {
  res.sendFile(path.join(`${__dirname}/../docs/index.html`))
})

module.exports = router
