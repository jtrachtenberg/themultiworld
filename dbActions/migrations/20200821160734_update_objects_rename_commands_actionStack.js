
exports.up = function(knex, Promise) {
    knex.schema.table('objects', function (t) {
        t.renameColumn('commands','actionStack')
      }).then(result=>console.log(result).catch(err=>console.log(err)))
    return Promise
};

exports.down = function(knex) {
    knex.schema.table('objects', function (t) {
        t.renameColumn('actionStack','commands')
      })
};
