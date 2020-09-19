
exports.up = function(knex) {
    return knex.schema.createTable('npcFactions', function (t) {
        t.bigIncrements('factionId').unsigned().notNullable().primary()
        t.biginteger('userid').unsigned().notNullable().references('userId').inTable('users')
        t.string('name').notNullable()
        t.json('stateData').notNullable().defaultTo([])
        t.timestamps(false,true)
    })

};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('npcFactions')
};
