const crypto = require('crypto')
const knex = require('knex')(require('./knexfile'))
const util = require('util')
const jwt = require('jsonwebtoken');

var pos= require('pos');

function deleteRows(tableName, rows) {
    return knex.transaction(trx => {
        let queries = rows.map(tuple => 
            trx.raw(
                trx(tableName).where(tuple).delete().toString()
            )               
            .transacting(trx)
        )
        return Promise.all(queries).then(trx.commit).catch(trx.rollback)
    })
}

function insertOrUpdate(tableName, rows){
    return knex.transaction(trx => {
        let queries = rows.map(tuple =>
          trx.raw(util.format(`%s ON DUPLICATE KEY UPDATE %s`,
            trx(tableName).insert(tuple).toString().toString(),
            trx(tableName).update(tuple).toString().replace(/^update\s.*\sset\s/i, '')
          ))               
          .transacting(trx)
        );
        return Promise.all(queries).then(trx.commit).catch(trx.rollback);
    })
}

function handleAudio(audio,userId,spaceId,placeId,objectId) {
    const rows = []
    const delrows = []
    const chkColumn = userId ? 'userId' : spaceId ? 'spaceId' : placeId ? 'placeId' : objectId ? 'objectId' : 'placeId'
    const chkColumnValue = userId ? userId : spaceId ? spaceId : placeId ? placeId : objectId ? objectId : 0

    knex("audio").where(`${chkColumn}`,"=",`${chkColumnValue}`).select("audioId", "externalId").then(response => {

        response.forEach((value) => {
            const sound = audio.find(sound => sound.externalId === value.externalId)
            if (typeof(sound) === 'undefined') delrows.push({audioId:value.audioId})
        })

        if (delrows.length > 0)
            deleteRows('audio', delrows)
    })
    if (audio.length > 0) {
        audio.forEach((value) => {
            if (typeof(value.src) !== 'undefined') {
                const insertRow = {
                    [chkColumn]: chkColumnValue,
                    name: value.name,
                    description: value.description,
                    src: value.src,
                    externalId: value.externalId,
                    externalUrl: value.externalUrl,
                    userName: value.userName
                }
                rows.push(insertRow)
            }
        }
        )

        insertOrUpdate('audio',rows)
    }

    return chkColumnValue
}


function handleImages(images,userId,spaceId,placeId,objectId) {
    const rows = []
    const delrows = []
    const chkColumn = userId ? 'userId' : spaceId ? 'spaceId' : placeId ? 'placeId' : objectId ? 'objectId' : 'placeId'
    const chkColumnValue = userId ? userId : spaceId ? spaceId : placeId ? placeId : objectId ? objectId : 0

    knex("images").where(`${chkColumn}`,"=",`${chkColumnValue}`).select("imageId", "externalId").then(response => {

        response.forEach((value) => {
            const image = images.find(image => image.id === value.externalId)
            if (typeof(image) === 'undefined') delrows.push({imageId:value.imageId})
        })

        if (delrows.length > 0)
            deleteRows('images', delrows)
    })
    if (images.length > 0) {
        images.forEach((value) => {
            if (typeof(value.alt) !== 'undefined') {
                const insertRow = {
                    [chkColumn]: chkColumnValue,
                    alt: value.alt,
                    apilink: value.apilink,
                    src: value.src,
                    externalId: value.id
                }
                rows.push(insertRow)
            }
        }
        )

        insertOrUpdate('images',rows)
    }

    return chkColumnValue
}

module.exports = {
    checkAuth({userId, inAuth}) {
        console.log('checkAuth')
        let isAuth = true
        let isEdit = true
        const authType = typeof(inAuth.type) !== 'undefined' ? inAuth.type : inAuth.objectId ? 'object' : inAuth.placeId ? 'place' : inAuth.spaceId ? 'space' : inAuth.userId ? 'user' : 'msg'
        const chkTable = authType+'s'
        const chkColumn = authType+'Id'
        const chkColumnValue = inAuth[chkColumn]
        //select users.userId as creatorUserId, u2.auth as userAuth, places.placeId, places.authType, places.title from users left join spaces on users.userId = spaces.userId left join places on places.spaceId = spaces.spaceId right join users as u2 on u2.userId=76 where placeId=18
        return knex('users').leftJoin('spaces',"spaces.userId","=","users.userId").leftJoin(chkTable,`${chkTable}.spaceId`,'=','spaces.spaceId').rightJoin(`users as u2`,`u2.userId`,`=`,userId).where(`${chkTable}.${chkColumn}`, chkColumnValue).select(`${chkTable}.${chkColumn}`,`${chkTable}.authType`, `${chkTable}.title`,'u2.isRoot','u2.auth','users.userId').then ( (rows) => {
            rows.forEach((row,i) => {
                row.auth = JSON.parse(row.auth) 

                if (row.isRoot) {
                    row.isAuth = true
                    row.isEdit = true
                    row.isAdmin = true
                }
                else if (row.authType === 0) {
                    row.isAuth = true
                    row.isEdit = row.userId === userId ? isEdit && true : false
                }
                else if (Array.isArray(row.auth)) {
                    //Check if user is authorized
                    let found = false
                    element = row.auth.find(item => {
                        if (typeof(item) === 'string')
                            item = JSON.parse(item)
                        return item[chkColumn] === chkColumnValue
                    })
                    if (typeof(element) !== 'undefined') {
                        found = true
                        if (element.edit) row.isEdit = true
                        else row.isEdit = false
                    } else row.isEdit = false
                    
                    row.isAuth = isAuth && found
                    
                }
                else row.isAuth = false

                rows[i]=row
            })
            return rows
        })
        .catch((err) => {
            console.log(err)
        })
       
    },
    addUser({userName,email,password,stateData}) {
        console.log(`Add user ${userName} with email ${email}`)
        const salt = crypto.randomBytes(16).toString('hex')
        const pw = knex.raw("sha2(concat(?,?),512)",[salt,password])
        stateData = JSON.stringify(stateData)
        const retVal = knex('users').insert({
            userName: userName,
            email: email,
            stateData: stateData,
            salt: salt,
            password: pw
        })
        return retVal
    },
    addFaction({userId,name}) {
        return knex('npcFactions').insert({
            userId: userId,
            name: name
        })
    },
    getFactions({userId}) {
        return knex('npcFactions').where({userId: userId}).select('factionId','name','stateData')
    },
    addScript({userId,name,script}) {
        return knex('npcFactions').insert({
            userId: userId,
            name: name,
            script: script
        })
    },
    getScripts({userId}) {
        return knex('npcScript').where({userId: userId}).select('scriptId','name','script')
    },
    updateUser({userId,userName,email,description,isRoot}) {
        console.log(`update user ${userId} with email ${email}`)
        return knex('users').where({userId: userId}).update({
            userName: userName,
            email: email,
            description: description,
            isRoot: isRoot,
            updated_at: new Date()
        }).returning('userId')
    },
    updateUserStateData({userId,stateData}) {
        stateData = stateData||{}
        delete stateData.logout
        stateData = JSON.stringify(stateData)

        return knex('users').where({userId: userId}).update({
            stateData: stateData,
            updated_at: new Date()
        }).returning('userId')
    },
    updateUserAuth({userId,auth}) {
        auth = auth||[]
//            retVal.push({authChange:"add",authType:item.authType,[item.authType]:item[item.authType]})

        return knex('users').where({userId: userId}).select("auth").then(rows => {
            const row = rows[0]

            if (typeof(row.auth) === 'string') row.auth= JSON.parse(row.auth.replace(/\\/g, ""))
            const currentAuth = (row.auth === null || typeof(row.auth) === 'undefined') ? [] : row.auth
            const findAuth = currentAuth.find(searchAuth => searchAuth[auth.authType] === auth[auth.authType])
            if (auth.authChange === 'add' && typeof(findAuth) === 'undefined') {
                delete auth.authChange
                delete auth.authType
                currentAuth.push(auth)
            }
            else if (auth.authChange === 'del' && typeof(findAuth) !== 'undefined') {
                currentAuth = currentAuth.filter(obj => obj[auth.authType] !== auth[auth.authType])
            }

            return knex('users').where({userId: userId}).update({ auth: JSON.stringify(currentAuth) }).returning('userId')   
        })
    },
    repopulate({userId}) {
        if (typeof userId === 'undefined') return new Promise(resolve => resolve(false))
        return knex("users").where({userId:userId}).first("stateData","userName").then(outerrows => {
            if (Object.keys(outerrows).length === 0) return new Promise(resolve => resolve(false))
            return updatePopulation({userId:userId,currentRoom:outerrows.stateData.currentRoom})
        })

    },
    logout({userId}) {

        if (typeof userId === 'undefined') return new Promise(resolve => resolve(false))

        return knex("users").where({userId:userId}).first("stateData","userName").then(outerrows => {
            if (Object.keys(outerrows).length === 0) return new Promise(resolve => resolve(false))
            const stateData = typeof outerrows.stateData === 'string' ? JSON.parse(outerrows.stateData) : outerrows.stateData
            if (typeof stateData.currentRoom === 'undefined') return new Promise(resolve => resolve(false))
            return knex("population").where({placeId: stateData.currentRoom}).select('people').then(rows => {
                if (rows.length === 0) {
                    return rows
                }
                let people = rows[0].people
                if (typeof people === 'string') people = JSON.parse(people)
                if (typeof people.find(inUserId => inUserId === userId) !== 'undefined') {
                    people = people.filter(id => id !== userId)
                    return knex("population").update({people: JSON.stringify(people)},['placeId']).where({placeId: stateData.currentRoom}).then(response => {
                        return new Promise(resolve => resolve({placeId: stateData.currentRoom, userName: outerrows.userName}) )
                    })
                }
            })
        })
    },
    search({search, term}) {
        //select spaces.spaceId, spaces.title,places.placeId from spaces join places on spaces.spaceId = places.spaceId where places.isRoot=1 AND spaces.title like 'j%'
        return knex('spaces').join('places','spaces.spaceId','=','places.spaceId').where('places.isRoot','=','1').andWhere('spaces.title','like',`${term}%`).limit(10).select("spaces.spaceId","spaces.title","places.placeId")
    },
    login({userName,email,password}) {
        userName=userName||""
        email=email||""
        const columnCheck = (userName === null || userName.length === 0) ? 'email' : 'userName'
        const checkVal = columnCheck === 'email' ? email : userName
        console.log(`login ${columnCheck} with ${checkVal}`)
        if (columnCheck === 'email')
            return knex('users').whereRaw('email = ? AND sha2(concat(salt,?),512) = password',[checkVal,password]).first('userId','userName','email','description','stateData','salt').then(user => {
 
                const token = jwt.sign(
                    { userId: user.userId },
                    user.salt,
                    { expiresIn: '24h' })
                user.token = token
                delete user.salt
                return user
            })
        else
        return knex('users').whereRaw('userName = ? AND sha2(concat(salt,?),512) = password',[checkVal,password]).first('userId','userName','email','description','stateData')
    },
    addSpace({userId,title,description,isRoot}) {
        console.log(`Add space ${title} with userId ${userId}`)
        var spaceId = knex('spaces').insert({
            userId,title,description,isRoot
        }).returning('spaceId')
        if (isRoot) {
            knex('users').where({userId: userId}).update({
                rootSpaceId: spaceId,
                updated_at: new Date()
            })    
        }
        return spaceId
    },
    addPlace({spaceId,title,description,isRoot, exits}) {
        var words = new pos.Lexer().lex(description)
        var tagger = new pos.Tagger()
        var taggedWords = tagger.tag(words)
        let poiArray = []
        for (i in taggedWords) {
            var taggedWord = taggedWords[i]
            const tag = taggedWord[1]
            if ( tag[0] === 'N' )
                poiArray.push({word:taggedWord[0],tag:tag,description:'You see nothing special.'})
        }
        const poi = JSON.stringify(poiArray)
        exits = JSON.stringify(exits)
        return knex('places').insert({
            spaceId,title,description,isRoot,exits,poi
        })
    },
    updateSpace({spaceId,userId,title,description,isRoot}) {
        console.log(`update space ${spaceId} with userId ${userId}`)
        var retVal = knex('spaces').where({spaceId: spaceId}).update({
            userId: userId,
            title: title,
            description: description,
            isRoot: isRoot,
            updated_at: new Date()
        }).returning('spaceId')
        if (isRoot) {
            knex('users').where({userId: userId}).update({
                rootSpaceId: spaceId,
                updated_at: new Date()
            })
        }
        return retVal
    },
    updatePlace({spaceId,placeId,title,description,isRoot,exits,poi,objects,images,audio, authType}) {
        exits = exits||[]
        exits = JSON.stringify(exits)
        authType = authType||0

        poi = poi||[]

        images = images||[]
        audio = audio||[]

        objects = objects||[]
        objects = objects.filter(object => object.type !== 'NPC')
        if (Array.isArray(images))
            handleImages(images,null,null,placeId,null)

        if (Array.isArray(audio))
            handleAudio(audio,null,null,placeId,null)

        objects = JSON.stringify(objects)
        return knex('places').where({placeId: placeId}).update({
            title: title,
            description: description,
            isRoot: isRoot,
            exits: exits,
            poi: poi,
            objects: objects,
            authType: authType,
            updated_at: new Date()
        }).returning('placeId')
    },
    loadSpaces({userId}) {
        return knex('spaces').where({userId: userId}).select('spaceId','title','description','isRoot')
    },
    loadPlace({placeId}) {
        console.log(`loadPlace ${placeId}`)
        //handle multiple rows - or split images into a separate function
        return knex('places').leftJoin('spaces','spaces.spaceId','=','places.spaceId').leftJoin('images','images.placeId','=','places.placeId').leftJoin('audio','audio.placeId','=','places.placeId').leftJoin('objects','objects.placeId','=','places.placeId').where({'places.placeId': placeId}).select('spaces.userId','places.placeId','places.spaceId','places.title','places.description','places.exits','places.poi','places.objects','places.authType','places.isRoot','images.src as imgsrc','images.alt','images.externalId as imgexternalId','images.apilink','audio.src as audiosrc','audio.description as audiodescription','audio.name as audioname','audio.externalId as audioexternalid','audio.username as audiousername','audio.externalUrl as audioexternalurl','objects.objectId','objects.title as objectTitle','objects.description as objectDescription','objects.actionStack', 'objects.userId as objectUserId')
        .then((rows) => {
            let images = []
            let audio = []
            let objects = []
            rows.forEach((row,i) => {
               console.log('row objects:', row.objects)
                if (i === 0) {
                    retVal = row
                    objects = row.objects
                }
                if (row.alt && !images.find(image => image.id === row.imgexternalId)) {
                    const image = {
                        src:row.imgsrc,
                        alt:row.alt,
                        apilink:row.apilink,
                        id:row.imgexternalId
                    }
                    images.push(image)
                }
                if (row.audiosrc && !audio.find(snd => snd.externalId === row.audioexternalid)) {
                    const sound = {
                        src:row.audiosrc,
                        name:row.audioname,
                        description:row.audiodescription,
                        externalId:row.audioexternalid,
                        externalUrl:row.audioexternalurl,
                        userName:row.audiousername
                    }
                    audio.push(sound)
                }
                if (row.objectId && !objects.find(object => object.objectId === row.objectId)) {
                    const object = {
                        objectId: row.objectId,
                        title: row.objectTitle,
                        description: row.objectDescription,
                        actionStack: row.actionStack,
                        userId: row.objectUserId,
                        type:'NPC'
                    }
                    objects.push(object)
                }
            })
            console.log('objects:', objects)
            rows[0].images = images
            rows[0].audio = audio
            rows[0].objects = objects
            return rows
        })
        .catch((err) => {
            console.log(err)
        })
    },
    loadPlaces({spaceId}) {
        console.log(`load places ${spaceId}`)
        return knex('places').where({spaceId: spaceId}).whereNotIn('placeId', [0]).select('placeId','spaceId','title')
    },
    loadDefaultPlace({userName}) {
        console.log(`loadDefault for ${userName}`)
        return knex('places').join('spaces','places.spaceId','=','spaces.spaceId').join('users','spaces.userId','=','users.userId').where({'users.userName': userName, 'spaces.isRoot':true,'places.isRoot':true}).select('places.placeId','places.spaceId')
    },
    addObject({userId, placeId, title, description, isRoot, actionStack,images, auth}) {
        userId=userId||0
        placeId=placeId||0
        images=images||[]
        actionStack=actionStack||[]
        auth=auth||[]
        console.log(actionStack)
        const originalActionStack = actionStack
        console.log(`Create Object ${title}`)
        let objectId
        if (isRoot === 0) {
            if (typeof actionStack === 'object') {
                if (actionStack.type && actionStack.type == 'NPC') {
                    actionStack = JSON.stringify(actionStack)
                    auth = JSON.stringify(auth)
                    console.log('111')
                    return knex('objects').insert({
                        userId,placeId,title,description,isRoot,actionStack,auth
                    }).then(response => {
                        console.log('222')
                        objectId = response[0]
                        handleImages(images,null,null,null,objectId)
                        console.log('objectId',objectId)
                        let event = []
                        event.push({type:'behaviors',useAIBehaviors: originalActionStack.useAIBehaviors,behaviors:originalActionStack.behaviors, inventory:originalActionStack.inventory, faction: originalActionStack.faction, scripts: originalActionStack.scripts})
                        event = JSON.stringify(event)
                        const interval = 0
                        const next = new Date(Date.now()+(10000))
                        console.log('next',next)
                        knex('timedevents').insert({
                            placeId:placeId,objectId:objectId,eventData:event,nextInterval:interval,next:next
                        }).then(response => response)
                        console.log('objectId is:')
                        console.log(objectId)
                        return response
                    }).catch(e => console.log(e))
                }
            }
        } else {
            actionStack = JSON.stringify(actionStack)
            auth = JSON.stringify(auth)
            return knex('objects').insert({
                userId,title,description,isRoot,actionStack,auth
            }).then(response => handleImages(images,null,null,null,response[0]))
        }
        //return objectId
    },
    updateObject({objectId, placeId, title, description, isRoot, actionStack, images, auth}) {
        placeId=placeId||0
        actionStack=actionStack||[]
        images=images||[]
        auth=auth||[]

        actionStack=JSON.stringify(actionStack)
        auth=JSON.stringify(auth)
        handleImages(images,null,null,null,objectId)

        const insertObj = {
            title: title,
            description: description,
            isRoot: isRoot,
            actionStack: actionStack,
            auth: auth,
            updated_at: new Date()
        }

        if (placeId > 0 ) insertObj.placeId = placeId
        return knex('objects').where({objectId: objectId}).update({
            ...insertObj
        })
    },
    loadUserObjects({userId}) {
        console.log('loadUserObjects')
        return knex('objects').leftJoin('images','images.objectId','=','objects.objectId').where('objects.userId',userId).andWhere('objects.isRoot',1).select('objects.objectId','objects.title','objects.description','objects.actionStack','objects.auth','images.src','images.alt','images.externalId','images.apilink')
        .then((rows) => {
            rows.forEach((row,i) => {
                if (row.src) {
                    const image = {
                        src:row.src,
                        alt:row.alt,
                        apilink:row.apilink,
                        id:row.externalId
                    }
                    row.images=[image]
                } else row.images=[]
                delete row.src
                delete row.alt
                delete row.apilink
                delete row.externalId
                rows[i]=row
            })
            return rows
        })
        .catch((err) => {
            console.log(err)
        })
    },
    async deleteObject({objectId}) {
        let retVal = await knex("images").where(`objectId`,"=",`${objectId}`).select("imageId").then(rows => {
            let delrows = []
            rows.forEach((row) => delrows.push(row))
            if (delrows.length > 0)
                deleteRows('images', delrows).then(response => {
                    return knex("objects").where({objectId: objectId}).del()
                    //return new Promise((resolve, reject) => () => resolve(response))
                })
            else {
                return knex("objects").where({objectId: objectId}).del()
                //return new Promise((resolve, reject) => () => resolve([1]))
            }    
            
        })
        return retVal    
    },
    loadImages({inObj}) {
        console.log('loadImages')
        if (!Array.isArray(inObj)) return
  
        return knex.transaction(trx => {
            let queries = inObj.map(tuple => 
                trx.raw(
                    trx("images").where(tuple).first("alt","src","placeId","objectId","userId").toString()
                )               
                .transacting(trx)
            )
            return Promise.all(queries).then(trx.commit).catch(trx.rollback)
        })
    },
    getAdminPopulation({userId}) {
        //select placeId, people from population where people NOT LIKE '%[]%'
        const DB = process.env.DB_TYPE || 'mysql'
        const joinRaw = DB === 'MariaDB' ? "left join users on JSON_CONTAINS(JSON_EXTRACT(people,'$'),users.userId, '$')" : "left join users on JSON_CONTAINS(JSON_EXTRACT(people,'$'),CAST(users.userId as JSON), '$')"
        return knex("population").leftJoin(`users as u2`,`u2.userId`,`=`,userId).joinRaw(joinRaw).where("people","NOT LIKE",'%[]%').select("population.placeId","population.people","u2.isRoot","users.userName").then(response => {
            if (response.length === 0) return response
            if (response[0].isRoot === 1) return response
            else return new Promise(resolve => resolve('Unauthorized'))
        })
    },
    updatePopulation({userId,currentRoom,newRoom,logout}) {
        logout = logout||false
        if (!logout && typeof newRoom === 'undefined') {//place them in the currentRoom
            return knex("population").where({placeId: currentRoom}).select('people').then(rows => {
                if (rows.length === 0) {
                    const people = [userId]
                    return knex("population").insert({placeId: currentRoom,people: JSON.stringify(people)}).returning('populationId')
                } else {
                    let people = rows[0].people
                    if (typeof people === 'string') people = JSON.parse(people)

                    if (typeof people.find(inUserId => inUserId === userId) === 'undefined') {
                        people.push(userId)
                        return knex("population").update({people: JSON.stringify(people)}).where({placeId: currentRoom})
                    }
                }
            })
        } else {//remove from old room
            return knex("population").where({placeId: currentRoom}).select('people').then(rows => {
                if (rows.length === 0) {
                    return rows
                }
                let people = rows[0].people
                if (typeof people === 'string') people = JSON.parse(people)
                if (typeof people.find(inUserId => inUserId === userId) !== 'undefined') {
                    people = people.filter(id => id !== userId)
                    return knex("population").update({people: JSON.stringify(people)}).where({placeId: currentRoom})
                }
            })
        } 
    },
    getPopulation ({placeId}) {
        //select `users`.`userId`, `users`.`userName`,images.src, images.alt from `population` left join users on JSON_CONTAINS(JSON_EXTRACT(people,'$'),CAST(users.userId as JSON), '$') left join images on images.userId=users.userId where population.placeId=21 UNION
        // select objects.objectId, objects.title, images.src, images.alt from objects left join images on images.objectId = objects.objectId where objects.placeId=21
        const DB = process.env.DB_TYPE || 'mysql'
        const joinRaw = DB === 'MariaDB' ? "left join users on JSON_CONTAINS(JSON_EXTRACT(people,'$'),users.userId, '$')" : "left join users on JSON_CONTAINS(JSON_EXTRACT(people,'$'),CAST(users.userId as JSON), '$')"
        return knex("population").joinRaw(joinRaw).leftJoin('images','images.userId','=','users.userId').where("population.placeId","=", placeId).select('users.userId','users.userName','images.src','images.alt').union(
            
                knex("objects").leftJoin("images","images.objectId","=","objects.objectId").where("objects.placeId","=", placeId).andWhere({isRoot:0}).select('objects.objectId as userId','objects.title as userName','images.src','images.alt')
            )
            .then(response => {
                return response
            })
    }
}


/*
  /*if (email !== null && email !== '')
            retUserCheck = knex('users').where({email: email}).on('query-response', (response, obj, builder) => {
                retUser = obj.response[0]
                salt = retUser.salt
                console.log(`salt is ${salt}`)
                hash = crypto.pbkdf2Sync(password,  
                    salt, 1000, 64, `sha512`).toString(`hex`)
                if (hash !== retUser.password)
                    retUser = null
            })
        else
            retUserCheck = knex('users').where({userName: userName}).on('query-response', (response, obj, builder) => {
                var retUserResp = obj.response[0]
                var jstring=JSON.stringify(retUserResp);
                var ju = JSON.parse(jstring)
                salt = ju[0].salt
                console.log(`salt is ${salt}`)
                hash = crypto.pbkdf2Sync(password,  
                    salt, 1000, 64, `sha512`).toString(`hex`)
                console.log(`hash is ${hash}`)
                console.log(`given hash is ${ju[0].password}`)
                if (hash === ju[0].password)
                    retUser = obj.response[0]
                else    
                    retUser = null
            })
        */