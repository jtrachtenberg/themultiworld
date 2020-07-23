const crypto = require('crypto')
const knex = require('knex')(require('./knexfile'))

module.exports = {
    create({item1, item2}) {
        console.log(`Add item ${item1} and ${item2}`)
        return knex('temp_item_table').insert({
            item1,item2
        })
    },
    addUser({userName,email,password}) {
        console.log(`Add user ${userName} with email ${email}`)
        const salt = crypto.randomBytes(16).toString('hex')
        const pw = knex.raw("sha2(concat(?,?),512)",[salt,password])
        console.log(pw)
        const retVal = knex('users').insert({
            userName: userName,
            email: email,
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
        console.log(`login user ${userName} with email ${email} and password ${password}`)
        return knex('users').whereRaw('userName = ? AND sha2(concat(salt,?),512) = password',[userName,password]).first('userId','userName','email','description','isRoot')
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