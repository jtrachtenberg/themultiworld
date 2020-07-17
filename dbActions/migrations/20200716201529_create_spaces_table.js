
exports.up = function(knex) {
    return knex.schema.createTable('spaces', function (t) {
        t.bigIncrements('spaceId').unsigned().notNullable().primary()
        t.bigInteger('userId').unsigned().notNullable()
        t.foreign('userId').references('users.userId')
        t.string('title').notNullable()
        t.text('description').nullable()
        t.boolean('isRoot').notNullable().defaultTo(false)
        t.timestamps(false,true)
        t.index('userId')
        t.index(['userId','isRoot'])
    })
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('spaces')
};
/*
CREATE TABLE IF NOT EXISTS `themultiworld`.`spaces`
(
 `spaceId`     bigint unsigned NOT NULL AUTO_INCREMENT ,
 `userId`      bigint unsigned NOT NULL ,
 `title`       varchar(255) NOT NULL ,
 `description` longtext NOT NULL ,
 `isRoot`      tinyint unsigned zerofill NOT NULL DEFAULT <2 ,

PRIMARY KEY (`spaceId`),
KEY `users` (`userId`),
CONSTRAINT `FK_36` FOREIGN KEY `users` (`userId`) REFERENCES `themultiworld`.`users` (`userId`)
);
*/