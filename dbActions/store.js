const crypto = require('crypto')
const knex = require('knex')(require('./knexfile'))
const util = require('util')

var pos= require('pos');
/*
insert into `images` (`alt`, `apilink`, `externalId`, `placeId`, `src`) values 
('frogs', 'https://api.unsplash.com/photos/B5PNmw5XSpk/download', 'B5PNmw5XSpk', 12, 
'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&ixid=eyJhcHBfaWQiOjE1MDg5MX0') 
ON DUPLICATE KEY  UPDATE `placeId` = 12, `alt` = 'froms', `apilink` = 'https://api.unsplash.com/photos/B5PNmw5XSpk/download', 
`src` = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&ixid=eyJhcHBfaWQiOjE1MDg5MX0',
 `externalId` = 'B5PNmw5XSpk'*/
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

function handleImages(modalReturn,userId,spaceId,placeId,objectId) {
    const rows = []
    const chkColumn = userId ? 'userId' : spaceId ? 'spaceId' : placeId ? 'placeId' : objectId ? 'objectId' : 'placeId'
    const chkColumnValue = userId ? userId : spaceId ? spaceId : placeId ? placeId : objectId ? objectId : 0

    const insertRow = {
        [chkColumn]: chkColumnValue,
        alt: modalReturn.alt,
        apilink: modalReturn.apilink,
        src: modalReturn.src,
        externalId: modalReturn.id
    }
    rows.push(insertRow)
    insertOrUpdate('images',rows)
}

module.exports = {
    create({item1, item2}) {
        console.log(`Add item ${item1} and ${item2}`)
        return knex('temp_item_table').insert({
            item1,item2
        })
    },
    addUser({userName,email,password,stateData}) {
        console.log(`Add user ${userName} with email ${email}`)
        const salt = crypto.randomBytes(16).toString('hex')
        const pw = knex.raw("sha2(concat(?,?),512)",[salt,password])
        const retVal = knex('users').insert({
            userName: userName,
            email: email,
            stateData: stateData,
            salt: salt,
            password: pw
        })
        console.log(retVal)
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
    login({userName,email,password}) {
        const columnCheck = (userName === null || userName.length === 0) ? 'email' : 'userName'
        const checkVal = columnCheck === 'email' ? email : userName
        console.log(`login ${columnCheck} with ${checkVal} and password ${password}`)
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
            console.log(tag)
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
    updatePlace({spaceId,placeId,title,description,isRoot,exits,poi,objects,modalReturn}) {
        exits = exits||[]
        exits = JSON.stringify(exits)
        modalReturn = modalReturn||{}
        //console.log(modalReturn)
        //modalObj = JSON.parse(modalReturn)

        handleImages(modalReturn,null,null,placeId,null)

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
        return knex('spaces').where({userId: userId}).select('spaceId','title','description')
    },
    loadPlace({placeId}) {
        return knex('places').where({placeId: placeId}).select('placeId','title','description','exits','poi','objects')
    },
    loadPlaces({spaceId}) {
        return knex('places').where({spaceId: spaceId}).select('placeId','spaceId','title')
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