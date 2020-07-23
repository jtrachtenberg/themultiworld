
exports.up = function(knex, Promise) {
    knex.schema.alterTable('users', function (t) {
        t.string('password').notNullable().defaultTo('')
        t.string('salt').notNullable().defaultTo('')
      })
};

exports.down = function(knex, Promise) {
    knex.schema.alterTable('users', function (t) {
        t.dropColumn('password')
        t.dropColumn('salt')
      })
};
