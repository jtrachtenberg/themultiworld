
exports.up = function(knex, Promise) {
    knex.schema.table('objects', function (t) {
        t.json('auth').nullable().defaultTo([])
      }).then(result=>console.log(result).catch(err=>console.log(err)))
    return Promise
};

exports.down = function(knex) {
    knex.schema.table('images', function (t) {
        t.dropColumn('auth')
      })
};
