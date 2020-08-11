//import * as Constants from './constants'
const Constants = require('./constants')

const JSONFieldType = Constants.isJSON ? 'JSON' : 'longtext'
console.log(JSONFieldType)
module.exports = {
    client: 'mysql',
    connection: {
      user: 'root',
      password: 'password',
      database: 'tmw',
      debug: true,
      typeCast: function (field, next) {
        if (field.type === JSONFieldType) {
          return (JSON.parse(field.string()))
        }
        return next()
      }
    }
  }