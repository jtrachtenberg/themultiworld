
exports.up = function(knex) {
    return knex.schema.createTable('objects', function (t) {
        t.bigIncrements('objectId').unsigned().notNullable().primary()
        t.bigInteger('userId').unsigned().nullable()
        t.foreign('userId').references('users.userId')
        t.bigInteger('spaceId').unsigned().nullable()
        t.foreign('spaceId').references('spaces.spaceId')
        t.string('name').notNullable()
        t.text('description').nullable()
        t.boolean('isRoot').notNullable().defaultTo(false)
        t.timestamps(false,true)
        t.index('spaceId')
        t.index(['spaceId','isRoot'])
        t.index('userId')
        t.index(['userId','isRoot'])
    })
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('objects')
};
/*
CREATE TABLE IF NOT EXISTS `themultiworld`.`objects`
(
 `objectId`    bigint unsigned NOT NULL AUTO_INCREMENT ,
 `placeId`     bigint unsigned NULL ,
 `userId`      bigint unsigned NULL ,
 `name`        varchar(255) NOT NULL ,
 `description` longtext NOT NULL ,

PRIMARY KEY (`objectId`),
KEY `places` (`placeId`),
CONSTRAINT `FK_61` FOREIGN KEY `places` (`placeId`) REFERENCES `themultiworld`.`places` (`placeId`),
KEY `users` (`userId`),
CONSTRAINT `FK_64` FOREIGN KEY `users` (`userId`) REFERENCES `themultiworld`.`users` (`userId`)
);*/