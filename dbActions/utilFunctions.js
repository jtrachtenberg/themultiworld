const { QueryBuilder } = require('knex')

const knex = require('knex')(require('./knexfile'))

module.exports = {
    async findPath({startPlaceId, endPlaceId}) {
        console.log('startPlaceId',startPlaceId)
        console.log('endPlaceId',endPlaceId)
        //select p2.placeId,p2.title,p2.spaceId, p2.exits from places p1 join places p2 on p1.spaceId=p2.spaceId where p1.spaceId=p2.spaceId AND p1.placeId in (18,42)
        return knex('places').join('places as p2','places.spaceId','=','p2.spaceId').whereIn('places.placeId',[startPlaceId,endPlaceId]).select('p2.spaceId','p2.placeId','p2.title','p2.exits').then(rows => {
            console.log(rows)
            const location = {
                placeId: startPlaceId,
                path: []
            }
            let queue = [location]
            const checked = []
            let retVal
            while (queue.length > 0) {
                console.log('startQueue',queue)
                const currentLocation = queue.shift()
                console.log(currentLocation.path)
                console.log(currentLocation.placeId)
                const row = rows.find(place => {
                    return place.placeId===currentLocation.placeId
                })
                console.log('row',row)
                const exits = row.exits
                console.log('exit',exits)
                if (exits.length)
                exits.forEach(exitItem => Object.keys(exitItem).forEach(exit => {
                    console.log('exitItem',exitItem[exit])
                    const inExit = exitItem[exit]
                    const newPath = currentLocation.path.slice()||[]
                    newPath.push(Number(inExit.placeId))

                    const newLocation = {
                        placeId: Number(inExit.placeId),
                        path: newPath
                    }
                    console.log('new',newLocation.placeId)
                    console.log('end',endPlaceId)
                    if (Number(newLocation.placeId) === Number(endPlaceId)) {
                        console.log('found')
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