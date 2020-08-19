
exports.up = function(knex, Promise) {
    knex.schema.table('objects', function (t) {
        t.dropForeign('spaceId')
        t.dropColumn('name')
        t.dropIndex('spaceId')
        t.dropIndex(['spaceId','isRoot'])
        t.foreign('placeId').references('places.placeId')
        t.string('title').notNullable()
        t.json('commands').nullable()
        t.index('placeId')
      }).then(result=>console.log(result).catch(err=>console.log(err)))
      return Promise
};

exports.down = function(knex) {
    knex.schema.table('objects', function (t) {
        t.dropForeign('placeId')
        t.string('name').notNullable()
        t.dropColumn('title')
        t.dropColumn('commands')
        t.dropIndex('placeId')
        t.dropIndex(['placeId','isRoot'])
      })
};
