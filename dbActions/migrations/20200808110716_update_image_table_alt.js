
exports.up = function(knex, Promise) {
    knex.schema.table('images', function (t) {
        t.renameColumn('userName','alt')
      }).then(result=>console.log(result).catch(err=>console.log(err)))
    return Promise
};

exports.down = function(knex) {
    knex.schema.table('images', function (t) {
        t.renameColumn('alt','userName')
      })
};
