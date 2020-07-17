-- ****************** SqlDBM: MySQL ******************;
-- ***************************************************;

DROP TABLE IF EXISTS `themultiworld`.`users`;



-- ************************************** `themultiworld`.`users`

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

-- ****************** SqlDBM: MySQL ******************;
-- ***************************************************;

DROP TABLE IF EXISTS `themultiworld`.`spaces`;

-- ************************************** `themultiworld`.`spaces`

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

-- ****************** SqlDBM: MySQL ******************;
-- ***************************************************;

DROP TABLE IF EXISTS `themultiworld`.`places`;



-- ************************************** `themultiworld`.`places`

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

-- 
-- ****************** SqlDBM: MySQL ******************;
-- ***************************************************;

DROP TABLE IF EXISTS `themultiworld`.`objects`;



-- ************************************** `themultiworld`.`objects`

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
);





