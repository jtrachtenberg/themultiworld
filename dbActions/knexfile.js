module.exports = {
    client: 'mysql',
    connection: {
      user: process.env.DB_USER||'root',
      password: process.env.DB_PASSWORD||'password',
      database: 'tmw',
      debug: false,
      typeCast: function (field, next) {
        if ( (field.type === 'JSON' || field.type === 'BLOB') && (field.name === 'poi' || field.name === 'exits' || field.name === 'stateData' || field.name === 'objects'|| field.name === 'eventData' || field.name === 'actionStack' || field.name === 'people')) {
          return (JSON.parse(field.string()))
        }
        return next()
      }
    }
  }