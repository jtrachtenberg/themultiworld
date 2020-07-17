
exports.up = function(knex) {
    return knex.schema.createTable('users', function (t) {
        t.bigIncrements('userId').unsigned().notNullable().primary()
        t.string('userName').notNullable()
        t.string('email').notNullable()
        t.text('description').nullable()
        t.bigInteger('rootSpaceId').unsigned().nullable()
        t.boolean('isRoot').notNullable().defaultTo(false)
        t.timestamps(false,true)
        t.unique('email')
        t.index('userName')
        t.index('rootSpaceId')
        t.index('isRoot')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTableIfExists('users')
};

/*
CREATE TABLE IF NOT EXISTS `themultiworld`.`users`
(
 `userId`      bigint unsigned NOT NULL AUTO_INCREMENT ,
 `userName`    varchar(60) NOT NULL ,
 `email`       varchar(255) NOT NULL ,
 `rootSpaceId` bigint NOT NULL ,
 `isRoot`      tinyint unsigned zerofill NOT NULL DEFAULT <2 ,

PRIMARY KEY (`userId`),
UNIQUE KEY `email` (`email`) USING HASH,
KEY `userName` (`userName`) USING HASH
);
*/