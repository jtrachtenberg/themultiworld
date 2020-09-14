const express = require('express')
const bodyParser = require('body-parser')
const auth = require('./auth');
const store = require('./store')

const app = express()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

app.use(express.static('public'))
app.use(bodyParser.json())

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header('Access-Control-Expose-Headers', 'Authorization')
    next();
  });
app.get('/', (req, res) => {
    res.sendStatus(200)
})
app.post('/addUser', auth, (req, res) => {
    store
        .addUser({
            userName: req.body.userName,
            email: req.body.email,
            password: req.body.password,
            stateData: req.body.stateData
        })
        .then((userId) => res.status(200).json(userId))
})
app.post('/updateUser', auth, (req, res) => {
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
app.post('/addSpace', auth, (req, res) => {
    store
        .addSpace({
            userId: req.body.userId,
            title: req.body.title,
            description: req.body.description,
            isRoot: req.body.isRoot
        })
        .then((spaceId) => res.status(200).json(spaceId))
})
app.post('/updateSpace', auth, (req, res) => {
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
app.post('/loadSpaces', auth, (req, res) => {
    store
        .loadSpaces({
            userId: req.body.userId
        })
        .then((spaces) => res.status(200).json(spaces))
})
app.post('/loadPlaces', auth, (req, res) => {
    store
        .loadPlaces({
            spaceId: req.body.spaceId
        })
        .then((places) => res.status(200).json(places))
})
app.post('/addPlace', auth, (req, res) => {
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
app.post('/loadPlace', auth, (req, res) => {
    store
        .loadPlace({
            placeId: req.body.placeId
        })
        .then((place) => res.status(200).json(place))
})
app.post('/updatePlace', auth, (req, res) => {
    store
       .updatePlace({
        spaceId: req.body.spaceId,
        placeId: req.body.placeId,
        title: req.body.title,
        description: req.body.description,
        isRoot: req.body.isRoot,
        authType: req.body.authType,
        exits: req.body.exits,
        poi: JSON.stringify(req.body.poi),
        objects: req.body.objects,
        images: req.body.images,
        audio: req.body.audio
    }).then((place) => res.status(200).json(place))
})
app.post('/loadDefaultPlace', auth, (req,res) => {
    store
    .loadDefaultPlace({
        userName: req.body.userName
    }).then((place) => res.status(200).json(place))
})
app.post('/addObject', auth, (req,res) => {
    store
    .addObject({
        userId: req.body.userId, 
        placeId: req.body.placeId,
        title: req.body.title, 
        description: req.body.description, 
        isRoot: req.body.isRoot, 
        actionStack: req.body.actionStack,
        images: req.body.images,
        auth: req.body.auth
    }).then((objectId) => res.status(200).json(objectId))
})
app.post('/loadUserObjects', auth, (req,res) => {
    store
    .loadUserObjects({
        userId: req.body.userId
    }).then((objects) => res.status(200).json(objects))
})
app.post('/updateObject', auth, (req, res) => {
    store
    .updateObject({
        objectId: req.body.objectId,
        placeId: req.body.placeId,
        title: req.body.title,
        description: req.body.description,
        isRoot: req.body.isRoot,
        actionStack: req.body.actionStack,
        images: req.body.images,
        auth: req.body.auth
    }).then((response) => res.status(200).json(response))
})
app.post('/deleteObject', auth, (req, res) => {
    store
    .deleteObject({
        objectId: req.body.objectId
    }).then(response => {
        if (typeof(response) === 'undefined') response=[1]
        res.status(200).json(response)
    })
})
app.post('/loadImages', auth, (req,res) => {
    store
    .loadImages({
        inObj: req.body.inObj
    }).then(response => {

        const finalResponse = []
        response.forEach(item => {
            finalResponse.push(item[0][0])
        })
        res.status(200).json(finalResponse)
    })
})
app.post('/getPopulation', auth, (req,res) => {
    store
    .getPopulation({
        placeId: req.body.placeId
    }).then(response => res.status(200).json(response))
})
var users = {}
io.on('connection', (socket) => {
    console.log('user connected')
    if (typeof users[socket.id] !== 'undefined') store.repopulate({userId: users[socket.id]})
    socket.on("incoming data", (data)=>{
        //the order is important here
        const type = typeof(data.type) !== 'undefined' ? data.type : typeof(data.stateData) === 'object' ? 'userStateData' : data.objectId ? 'object' : data.placeId ? 'place' : data.spaceId ? 'space' : data.userId ? 'user' : 'msg'
        //Here we broadcast it out to all other sockets EXCLUDING the socket which sent us the data
       if (type === 'admin') {
           store[data.cmd]({userId: data.userId}).then(response => {
               const retObj = {type:'admin',admincmd:data.admincmd,cmd:data.cmd,response:response}
               const channel = `auth:${data.userId}`
               socket.emit(channel, retObj)
           })
       }
       else if (type === 'auth') {
           if (data.userId === 0) return
           users[socket.id] = data.userId
           store.checkAuth({userId: data.userId, inAuth: data.auth}).then(response => {
               const retObj = {type:'auth',isAuth: response}
               const channel = `auth:${data.userId}`
               socket.emit(channel, retObj)
           })
       }
       else if (type === 'msg') {
        const channel = `place:${data.msgPlaceId}`

        socket.broadcast.emit(channel, {msg: data})
       } else if (type === 'place') {
        socket.broadcast.emit("outgoing data", {[type]: data});
       } else if (type === 'userStateData') {
           const logout = data.stateData.logout

           store.updateUserStateData({
               userId: data.userId,
               stateData: data.stateData
           }).then(response => {
               if (typeof(data.auth) !== 'undefined')
                store.updateUserAuth({
                    userId: data.userId,
                    auth: data.auth
                }).then(response => {})
               store.updatePopulation({
                   userId: data.userId,
                   currentRoom: data.stateData.currentRoom,
                   newRoom: data.stateData.newRoom,
                   logout: logout
               })
           })
       }
       else socket.broadcast.emit("outgoing data", {[type]: data});
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
        store.logout({userId: users[socket.id]}).then(response => {
            const channel = `place:${response.placeId}`
            const data = {msg: `disapparated.`, exit:true, msgPlaceId: response.placeId, userName: response.userName}
            socket.broadcast.emit(channel, {msg: data})
        })
    });
});

var server = http.listen(8880, () => {
    console.log('Server running on localhost:8880')
})
//Needed for Unit Testing
module.exports = server