const knex = require('knex')(require('./knexfile'))

module.exports = {
    async getObject({objectId}) {
        return knex('objects').leftJoin('images','images.objectId','=','objects.objectId').where('objects.objectId','=',objectId).andWhere('objects.isRoot',1).select('objects.objectId','objects.title','objects.description','objects.actionStack','objects.auth','images.src','images.alt','images.externalId','images.apilink')
        .then((rows) => {
            rows.forEach((row,i) => {
                if (row.src) {
                    const image = {
                        src:row.src,
                        alt:row.alt,
                        apilink:row.apilink,
                        id:row.externalId
                    }
                    row.images=[image]
                } else row.images=[]
                delete row.src
                delete row.alt
                delete row.apilink
                delete row.externalId
                rows[i]=row
            })
            return rows
        })
        .catch((err) => {
            console.log(err)
        })
    },
    async moveObjectToPlace({oldPlaceId, newPlaceId, objectId, name, io}) {
        return knex.transaction( trx => {
            let queries = []
            queries.push( 
                trx.raw(
                    trx('timedevents').where({objectId:objectId}).update({placeId:newPlaceId}).toString()
                )               
                .transacting(trx)
            )
            queries.push( 
                trx.raw(
                    trx('objects').where({objectId:objectId}).update({placeId:newPlaceId}).toString()
                )               
                .transacting(trx)
            )
            return Promise.all(queries).then(values => {
                trx.commit
                if (typeof io !== 'undefined') {
                    let channel = `place:${oldPlaceId}`
                    const data = {msg: 'left.', exit:true, msgPlaceId: oldPlaceId, userName: name, src: 'NPC'}
                    io.emit(channel, {msg: data})
                    io.emit("outgoing data", {place: {placeId: oldPlaceId},update:'reload'});
                    channel = `place:${newPlaceId}`
                    data.msg = 'arrived.'
                    io.emit(channel, {msg: data})
                    io.emit("outgoing data", {place: {placeId: newPlaceId},update:'reload'});
                }       
            }).catch(trx.rollback)
        })
    },
   
    async diceRoll({max, mod}) {
        return mod + Math.floor(Math.random()*max)
    },
    async didItHappen({max, min}) {
        let rnd = 1+Math.floor(Math.random()*Number(max))
        return rnd<min
    },
    async findPath({startPlaceId, endPlaceId}) {
        //select p2.placeId,p2.title,p2.spaceId, p2.exits from places p1 join places p2 on p1.spaceId=p2.spaceId where p1.spaceId=p2.spaceId AND p1.placeId in (18,42)
        return knex('places').join('places as p2','places.spaceId','=','p2.spaceId').whereIn('places.placeId',[startPlaceId,endPlaceId]).select('p2.spaceId','p2.placeId','p2.title','p2.exits').then(rows => {
            const location = {
                placeId: startPlaceId,
                path: []
            }
            let queue = [location]
            const checked = []
            let retVal
            while (queue.length > 0) {
                const currentLocation = queue.shift()
                const row = rows.find(place => {
                    return place.placeId===currentLocation.placeId
                })
                const exits = row.exits
                if (exits.length)
                exits.forEach(exitItem => Object.keys(exitItem).forEach(exit => {
                    const inExit = exitItem[exit]
                    const newPath = currentLocation.path.slice()||[]
                    newPath.push(Number(inExit.placeId))

                    const newLocation = {
                        placeId: Number(inExit.placeId),
                        path: newPath
                    }
                    if (Number(newLocation.placeId) === Number(endPlaceId)) {
                        retVal = new Promise(resolve => resolve(newLocation.path))
                        queue = []
                    } else
                        if (typeof checked.find(item => item === newLocation.placeId) === 'undefined') queue.push(newLocation)
                }))
                checked.push(Number(currentLocation.placeId))

            }
            return new Promise(resolve => resolve(retVal))
        })
    }
}