
exports.up = function(knex, Promise) {
    knex.schema.table('places', function (t) {
        t.json('poi').nullable()
        t.json('objects').nullable()
      }).then(result=>console.log(result).catch(err=>console.log(err)))
    return Promise
};

exports.down = function(knex) {
    knex.schema.table('places', function (t) {
        t.dropColumn('poi')
        t.dropColumn('objects')
    })
};
