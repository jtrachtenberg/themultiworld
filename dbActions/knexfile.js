module.exports = {
    client: 'mysql',
    connection: {
      user: 'root',
      password: 'password',
      database: 'tmw',
      debug: false,
      typeCast: function (field, next) {
        if (field.type === 'JSON') {
          return (JSON.parse(field.string()))
        }
        return next()
      }
    }
  }