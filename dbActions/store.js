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
    }
}