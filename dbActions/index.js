const express = require('express')
const bodyParser = require('body-parser')

const store = require('./store')

const app = express()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

app.use(express.static('public'))
app.use(bodyParser.json())

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
app.get('/', (req, res) => {
    res.sendStatus(200)
})
app.post('/create', (req, res) => {
    store
        .create({
            item1: req.body.item1,
            item2: req.body.item2
        })
        .then(() => res.sendStatus(200))
})
app.post('/addUser', (req, res) => {
    console.log('add user')
    store
        .addUser({
            userName: req.body.userName,
            email: req.body.email,
            password: req.body.password,
            stateData: req.body.stateData
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
app.post('/loadSpaces', (req, res) => {
    store
        .loadSpaces({
            userId: req.body.userId
        })
        .then((spaces) => res.status(200).json(spaces))
})
app.post('/loadPlaces', (req, res) => {
    store
        .loadPlaces({
            spaceId: req.body.spaceId
        })
        .then((places) => res.status(200).json(places))
})
app.post('/addPlace', (req, res) => {
    store
        .addPlace({
            spaceId: req.body.spaceId,
            title: req.body.title,
            description: req.body.description,
            isRoot: req.body.isRoot,
            exits: req.body.exits
        })
        .then((placeId) => res.status(200).json(placeId))
})
app.post('/loadPlace', (req, res) => {
    store
        .loadPlace({
            placeId: req.body.placeId
        })
        .then((place) => res.status(200).json(place))
})
app.post('/updatePlace', (req, res) => {
    store
       .updatePlace({
        spaceId: req.body.spaceId,
        placeId: req.body.placeId,
        title: req.body.title,
        description: req.body.description,
        isRoot: req.body.isRoot,
        exits: req.body.exits,
        poi: JSON.stringify(req.body.poi),
        objects: req.body.objects,
        images: req.body.images
    }).then((place) => res.status(200).json(place))
})
app.post('/loadDefaultPlace', (req,res) => {
    store
    .loadDefaultPlace({
        userName: req.body.userName
    }).then((place) => res.status(200).json(place))
})
app.post('/addObject', (req,res) => {
    store
    .addObject({
        userId: req.body.userId, 
        placeId: req.body.placeId,
        title: req.body.title, 
        description: req.body.description, 
        isRoot: req.body.isRoot, 
        actionStack: req.body.actionStack,
        images: req.body.images
    }).then((objectId) => res.status(200).json(objectId))
})
app.post('/loadUserObjects', (req,res) => {
    store
    .loadUserObjects({
        userId: req.body.userId
    }).then((objects) => res.status(200).json(objects))
})
app.post('/updateObject', (req, res) => {
    store
    .updateObject({
        objectId: req.body.objectId,
        placeId: req.body.placeId,
        title: req.body.title,
        description: req.body.description,
        isRoot: req.body.isRoot,
        actionStack: req.body.actionStack,
        images: req.body.images
    }).then((response) => res.status(200).json(response))
})
app.post('/deleteObject', (req, res) => {
    store
    .deleteObject({
        objectId: req.body.objectId
    }).then(response => {
        if (typeof(response) === 'undefined') response=[1]
        res.status(200).json(response)
    })
})
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on("incoming data", (data)=>{
        console.log('incoming data')
        //console.log(data)
        //the order is important here
        const type = typeof(data.stateData) === 'object' ? 'userStateData' : data.objectId ? 'object' : data.placeId ? 'place' : data.spaceId ? 'space' : data.userId ? 'user' : 'msg'
        //Here we broadcast it out to all other sockets EXCLUDING the socket which sent us the data
       if (type === 'msg') {
        const channel = `place:${data.msgPlaceId}`
        console.log(channel)
        socket.broadcast.emit(channel, {msg: data})
       } else if (type === 'place') {
        socket.broadcast.emit("outgoing data", {[type]: data});
       } else if (type === 'userStateData') {
           store.updateUserStateData({
               userId: data.userId,
               stateData: data.stateData
           }).then(response => {})
       }
       else socket.broadcast.emit("outgoing data", {[type]: data});
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

var server = http.listen(8880, () => {
    console.log('Server running on localhost:8880')
})
//Needed for Unit Testing
module.exports = server