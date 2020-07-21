const knex = require('knex')(require('./knexfile'))

module.exports = {
    create({item1, item2}) {
        console.log(`Add item ${item1} and ${item2}`)
        return knex('temp_item_table').insert({
            item1,item2
        })
    },
    addUser({userName,email}) {
        console.log(`Add user ${userName} with email ${email}`)
        return knex('users').insert({
            userName, email
        }).returning('userId')
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