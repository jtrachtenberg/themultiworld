const jwt = require('jsonwebtoken');
const knex = require('knex')(require('./knexfile'))

module.exports = async (req, res, next) => {
    console.log('auth')
  try {
    console.log(req.headers)
    const token = req.headers.authorization.split(' ')[1];
    const userId = req.body.userId
    let checkUserId
    console.log(userId)
    await knex('users').where({userId: userId}).first('salt').then(user => {
        const decodedToken = jwt.verify(token, user.salt);
        checkUserId = decodedToken.userId;
        console.log(decodedToken)

        console.log(checkUserId)
        if (userId === checkUserId) {
            next();  
        } else {
            throw 'Invalid user ID';
        }
    })
  } catch {
      console.log('error')
    res.status(401).json({
      error: new Error('Invalid request!')
    });
  }
};