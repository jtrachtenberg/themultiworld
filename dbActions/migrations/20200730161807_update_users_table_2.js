
exports.up = function(knex, Promise) {
    knex.schema.table('users', function (t) {
        t.json('stateData').nullable()
      }).then(result=>console.log(result).catch(err=>console.log(err)))
    return Promise
};

exports.down = function(knex) {
    knex.schema.table('users', function (t) {
        t.dropColumn('stateData')
      })
};
