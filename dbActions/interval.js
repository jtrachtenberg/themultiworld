const crypto = require('crypto')
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
        
    }
}