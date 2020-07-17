
exports.up = function(knex) {
  return knex.schema.createTable('temp_item_table', function (t) {
      t.increments('id').primary()
      t.string('item1').notNullable()
      t.string('item2').notNullable()
      t.timestamps(false,true)
  })
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('temp_item_table')
};
