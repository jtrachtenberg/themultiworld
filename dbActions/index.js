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
    store
        .addUser({
            userName: req.body.userName,
            email: req.body.email,
            password: req.body.password
        })
        .then((userId) => res.status(200).json(userId))
})
app.post('/updateUser', (req, res) => {
    store
        .updateUser({
            userId: req.body.userId,
            userName: req.body.userName,
            email: req.body.email,
            description: req.body.description,
            isRoot: req.body.isRoot
        })
        .then((userId) => res.status(200).json(userId))
})
app.post('/loginUser', (req, res) => {
    store
        .login({
            userName: req.body.userName,
            email: req.body.email,
            password: req.body.password
        })
        .then((user) => res.status(200).json(user))
})
app.post('/addSpace', (req, res) => {
    store
        .addSpace({
            userId: req.body.userId,
            title: req.body.title,
            description: req.body.description,
            isRoot: req.body.isRoot
        })
        .then((spaceId) => res.status(200).json(spaceId))
})
app.post('/updateSpace', (req, res) => {
    store
        .updateSpace({
            spaceId: req.body.spaceId,
            userId: req.body.userId,
            title: req.body.title,
            description: req.body.desc,
            isRoot: req.body.isRoot
        })
        .then((spaceId) => res.status(200).json(spaceId))
})
app.listen(7555, () => {
    console.log('Server running on localhost:7555')
})