const crypto = require('crypto')
const knex = require('knex')(require('./knexfile'))
const util = require('util')

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
        stateData = JSON.stringify(stateData)

        return knex('users').where({userId: userId}).update({
            stateData: stateData
        }).returning('userId')
    },
    login({userName,email,password}) {
        userName=userName||""
        email=email||""
        const columnCheck = (userName === null || userName.length === 0) ? 'email' : 'userName'
        const checkVal = columnCheck === 'email' ? email : userName
        console.log(`login ${columnCheck} with ${checkVal}`)
        if (columnCheck === 'email')
            return knex('users').whereRaw('email = ? AND sha2(concat(salt,?),512) = password',[checkVal,password]).first('userId','userName','email','description','isRoot','stateData')
        else
        return knex('users').whereRaw('userName = ? AND sha2(concat(salt,?),512) = password',[checkVal,password]).first('userId','userName','email','description','isRoot','stateData')
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
    updatePlace({spaceId,placeId,title,description,isRoot,exits,poi,objects,images}) {
        exits = exits||[]
        exits = JSON.stringify(exits)
        
        poi = poi||[]

        images = images||[]

        objects = objects||[]
        objects = JSON.stringify(objects)
        if (Array.isArray(images))
            handleImages(images,null,null,placeId,null)

        var retVal = knex('places').where({placeId: placeId}).update({
            title: title,
            description: description,
            isRoot: isRoot,
            exits: exits,
            poi: poi,
            objects: objects,
            updated_at: new Date()
        }).returning('placeId')
        return retVal
    },
    loadSpaces({userId}) {
        return knex('spaces').where({userId: userId}).select('spaceId','title','description','isRoot')
    },
    loadPlace({placeId}) {
        console.log(`loadPlace ${placeId}`)
        //handle multiple rows - or split images into a separate function
        return knex('places').leftJoin('images','images.placeId','=','places.placeId').where({'places.placeId': placeId}).select('places.placeId','places.spaceId','places.title','places.description','places.exits','places.poi','places.objects','images.src','images.alt','images.externalId','images.apilink')
        .then((rows) => {
            let retVal
            let images = []
            rows.forEach((row,i) => {
                if (i === 0) {
                    retVal = row
                }
                if (row.src) {
                    const image = {
                        src:row.src,
                        alt:row.alt,
                        apilink:row.apilink,
                        id:row.externalId
                    }
                    images.push(image)
                }
            })
            rows[0].images = images
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
    addObject({userId, placeId, title, description, isRoot, actionStack,images}) {
        userId=userId||0
        placeId=placeId||0
        images=images||[]
        actionStack=actionStack||[]

        console.log(`Create Object ${title}`)
        actionStack = JSON.stringify(actionStack)
        var objectId = knex('objects').insert({
            userId,title,description,isRoot,actionStack
        }).then(response => handleImages(images,null,null,null,response[0]))

        return objectId
    },
    updateObject({objectId, placeId, title, description, isRoot, actionStack, images}) {
        placeId=placeId||0
        actionStack=actionStack||[]
        images=images||[]

        actionStack=JSON.stringify(actionStack)
        handleImages(images,null,null,null,objectId)

        const insertObj = {
            title: title,
            description: description,
            isRoot: isRoot,
            actionStack: actionStack,
            updated_at: new Date()
        }

        if (placeId > 0 ) insertObj.placeId = placeId
        return knex('objects').where({objectId: objectId}).update({
            ...insertObj
        })
    },
    loadUserObjects({userId}) {
        return knex('objects').leftJoin('images','images.objectId','=','objects.objectId').where('objects.userId',userId).andWhere('objects.isRoot',1).select('objects.objectId','objects.title','objects.description','objects.actionStack','images.src','images.alt','images.externalId','images.apilink')
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