const express = require('express')
const bodyParser = require('body-parser')

const store = require('./store')

const app = express()
app.use(express.static('public'))
app.use(bodyParser.json())

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.post('/create', (req, res) => {
    store
        .create({
            item1: req.body.item1,
            item2: req.body.item2
        })
        .then(() => res.sendStatus(200))
})
app.post('/addUser', (req, res) => {
    console.log(req.body)
    store
        .addUser({
            userName: req.body.userName,
            email: req.body.email
        })
        .then((userId) => res.status(200).json(userId))
})
app.listen(7555, () => {
    console.log('Server running on localhost:7555')
})