
exports.up = function(knex) {
    return knex.schema.createTable('npcScript', function (t) {
        t.bigIncrements('scriptId').unsigned().notNullable().primary()
        t.biginteger('userid').unsigned().notNullable().references('userId').inTable('users')
        t.string('name').notNullable()
        t.json('script').notNullable().defaultTo([])
        t.timestamps(false,true)
    })

};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('npcScripts')
};
