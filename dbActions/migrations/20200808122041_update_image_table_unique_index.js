
exports.up = function(knex, Promise) {
    knex.schema.table('images', function (t) {
        t.unique(['placeId','externalId'],'images_placeId_externalId_index')
        t.unique(['userId','externalId'],'images_userId_externalId_index')
        t.unique(['spaceId','externalId'],'images_spaceId_externalId_index')
        t.unique(['objectId','externalId'],'images_objectId_externalId_index')
      }).then(result=>console.log(result).catch(err=>console.log(err)))
    return Promise
};

exports.down = function(knex) {
  knex.schema.table('images', function (t) {
      t.dropUnique(['placeId','externalId'])
      t.dropUnique(['userId','externalId'])
      t.dropUnique(['spaceId','externalId'])
      t.dropUnique(['objectId','externalId'])
  })
};
