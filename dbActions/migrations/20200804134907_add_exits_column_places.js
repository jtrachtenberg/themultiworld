
exports.up = function(knex, Promise) {
    knex.schema.table('places', function (t) {
        t.json('exits').nullable()
      }).then(result=>console.log(result).catch(err=>console.log(err)))
    return Promise
};

exports.down = function(knex) {
    knex.schema.table('places', function (t) {
        t.dropColumn('exits')
    })
};
