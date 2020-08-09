
exports.up = function(knex) {
    return knex.schema.createTable('images', function (t) {
        t.bigIncrements('imageId').unsigned().notNullable().primary()
        t.biginteger('userid').unsigned().nullable().references('userId').inTable('users')
        t.biginteger('placeId').unsigned().nullable().references('placeId').inTable('places')
        t.biginteger('spaceId').unsigned().nullable().references('spaceId').inTable('spaces')
        t.biginteger('objectId').unsigned().nullable().references('objectId').inTable('objects')
        t.string('userName').notNullable()
        t.string('apilink').notNullable()
        t.string('src').notNullable()
        t.string('externalId').notNullable()
        t.timestamps(false,true)
        t.index('userId')
        t.index('spaceId')
        t.index('placeId')
        t.index('objectId')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('images')
};
