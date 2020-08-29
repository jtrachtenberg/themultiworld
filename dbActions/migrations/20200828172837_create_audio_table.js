
exports.up = function(knex) {
    return knex.schema.createTable('audio', function (t) {
        t.bigIncrements('audioId').unsigned().notNullable().primary()
        t.biginteger('userid').unsigned().nullable().references('userId').inTable('users')
        t.biginteger('placeId').unsigned().nullable().references('placeId').inTable('places')
        t.biginteger('spaceId').unsigned().nullable().references('spaceId').inTable('spaces')
        t.biginteger('objectId').unsigned().nullable().references('objectId').inTable('objects')
        t.string('name').notNullable()
        t.text('description').notNullable()
        t.string('src').notNullable()
        t.string('externalId').notNullable()
        t.string('userName').notNullable()
        t.string('externalUrl').notNullable()
        t.timestamps(false,true)
        t.index('userId')
        t.index('spaceId')
        t.index('placeId')
        t.index('objectId')
        t.unique(['placeId','externalId'],'audio_placeId_externalId_index')
        t.unique(['userId','externalId'],'audio_userId_externalId_index')
        t.unique(['spaceId','externalId'],'audio_spaceId_externalId_index')
        t.unique(['objectId','externalId'],'audio_objectId_externalId_index')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('audio')
};
