module.exports = {
    client: 'mysql',
    connection: {
      user: 'root',
      password: 'password',
      database: 'tmw',
      debug: false,
      typeCast: function (field, next) {
        if ( (field.type === 'JSON' || field.tyle === 'BLOB') && (field.name === 'poi' || field.name === 'exits' || field.name === 'stateData' || field.name === 'objects')) {
          return (JSON.parse(field.string()))
        }
        return next()
      }
    }
  }