
exports.up = function(knex) {
    return knex.schema.createTable('timedevents', function (t) {
        t.bigIncrements('eventId').unsigned().notNullable().primary()
        t.biginteger('userid').unsigned().nullable().references('userId').inTable('users')
        t.biginteger('placeId').unsigned().nullable().references('placeId').inTable('places')
        t.biginteger('spaceId').unsigned().nullable().references('spaceId').inTable('spaces')
        t.biginteger('objectId').unsigned().nullable().references('objectId').inTable('objects')
        t.json('eventData').notNullable().defaultTo([])
        t.integer('nextInterval').notNullable().defaultTo(0)
        t.datetime('next').notNullable().defaultTo(knex.fn.now())
        t.timestamps(false,true)
        t.index('userId')
        t.index('spaceId')
        t.index('placeId')
        t.index('objectId')
        t.index('next')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('audio')
};
