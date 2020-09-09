
exports.up = function(knex) {
    return knex.schema.createTable('population', function (t) {
        t.bigIncrements('populationId').unsigned().notNullable().primary()
        t.biginteger('placeId').unsigned().nullable().references('placeId').inTable('places')
        t.json('people').nullable()
        t.timestamps(false,true)
        t.index('placeId')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('population')
};
