const knex = require('knex')(require('./knexfile'))
const util = require('util')
const jwt = require('jsonwebtoken');
var pos= require('pos');
const utilFunctions = require('./utilFunctions');

module.exports = {
    checkTimedEvents(io) {
        const data = {msg: 'Ghost message', msgPlaceId: 18, userName: ""}
        //io.emit(`place:18`,{msg: data})
        //console.log(new Date())

        /*const path = utilFunctions.findPath({startPlaceId:18,endPlaceId:38}).then (result => {
            console.log('path is',result)
        })*/
        
    },
    worldTick(io) {
        console.time('worldTick')
        knex('timedevents').leftJoin('places','places.placeId','=','timedevents.placeId').leftJoin('objects','objects.objectId','=','timedevents.objectId').where({nextInterval:0}).select('timedevents.userId','timedevents.spaceId','timedevents.placeId','timedevents.objectId','eventData','places.exits','places.objects','objects.title as name').then(rows => {
            rows.forEach(row => {
                if (typeof row.exits === 'string') row.exits = JSON.parse(row.exits.replace(/\\/g,""))
                if (typeof row.objects === 'string') row.objects = JSON.parse(row.objects.replace(/\\/g,""))

                if (typeof row.eventData === 'string') row.eventData = JSON.parse(row.eventData.replace(/\\/g,""))
                row.eventData.forEach(eventData => {
                    if (eventData.type === 'behaviors') {//NPC Behaviors
                        const behaviors = eventData.behaviors
                        utilFunctions.didItHappen({max: 20,min:behaviors.advent}).then(response => {
                            if (response && Array.isArray(row.exits) && row.exits.length > 0) {
                                utilFunctions.diceRoll({max:row.exits.length,mod:1}).then(async (exitNum) => {
                                    const exit = row.exits[exitNum-1]
                                    const newPlaceId = exit[Object.keys(exit)[0]].placeId
                                    //This must be async to avoid race conditions
                                    await utilFunctions.moveObjectToPlace({oldPlaceId: row.placeId, newPlaceId: newPlaceId, objectId: row.objectId, type: eventData.type, name: row.name, io: io}).then(response => response)
                                })
                            } else {
                                //console.log('will not move')
                            }
                        })
                    }
                })
            })
        })
        console.timeEnd('worldTick')
    }
}