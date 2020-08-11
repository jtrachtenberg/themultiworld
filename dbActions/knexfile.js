const JSONFieldType = 'JSON'// 'BLOB'
console.log(JSONFieldType)
module.exports = {
    client: 'mysql',
    connection: {
      user: 'root',
      password: 'password',
      database: 'tmw',
      debug: true,
      typeCast: function (field, next) {
        if (field.type === JSONFieldType && (field.name === 'poi' || field.name === 'exits' || field.name === 'stateData' || field.name === 'objects')) {
          return (JSON.parse(field.string()))
        }
        return next()
      }
    }
  }