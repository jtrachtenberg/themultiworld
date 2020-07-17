
exports.up = function(knex) {
    return knex.schema.createTable('places', function (t) {
        t.bigIncrements('placeId').unsigned().notNullable().primary()
        t.bigInteger('spaceId').unsigned().notNullable()
        t.foreign('spaceId').references('spaces.spaceId')
        t.string('title').notNullable()
        t.text('description').nullable()
        t.boolean('isRoot').notNullable().defaultTo(false)
        t.timestamps(false,true)
        t.index('spaceId')
        t.index(['spaceId','isRoot'])
    })
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('places')
};
/*
CREATE TABLE IF NOT EXISTS `themultiworld`.`places`
(
 `placeId`     bigint unsigned NOT NULL AUTO_INCREMENT ,
 `spaceId`     bigint unsigned NOT NULL ,
 `title`       varchar(255) NOT NULL ,
 `description` longtext NOT NULL ,
 `isRoot`      tinyint unsigned zerofill NOT NULL DEFAULT <2 ,

PRIMARY KEY (`placeId`),
KEY `spaces` (`spaceId`),
CONSTRAINT `FK_49` FOREIGN KEY `spaces` (`spaceId`) REFERENCES `themultiworld`.`spaces` (`spaceId`)
);
*/