
exports.seed = function(knex, Promise) {
  return knex("places").del()
      .then(() => {
          return knex("spaces").del();
      })
      .then(() => {
        return knex("users").del();
      })
      .then(() => {
          const users = [];
          
          users.push({userName: 'Creator', rootSpaceId: 0, email: ''})
          users.push({userName: 'angleet', rootSpaceId: 0, email: 'j.trachtenberg@gmail.com', salt: '79858bc8a563b4d848adca43f8002f1e', password: '41532dac6c3c759368bfe6e9136bb9f05b953e22b1735bea91c390b9175b31991b60d480142b1af23e51ef33367c76bae7179a08af20c1f31070926ea7cce2e4', isRoot: true})
            
          return knex("users").insert(users);
      })
      .then(() => {
          return knex('users').pluck('userId').then((userIds) => {
              const spaces = [];

              spaces.push({userId: userIds[0], title: 'Limbo', description: 'A formless void.', isRoot: true })
              return knex("spaces").insert(spaces);
      })
      .then(() => {
          return knex("spaces").pluck("spaceId").then((spaceIds) => {
                const places = [];

                places.push({spaceId: spaceIds[0], title: 'A formless void', description: 'Nothingness stretches in all directions.   There is no sense of up, down, or anything.  It is everything at all times.', isRoot: true })
                console.log(places)
                return knex("places").insert(places)
              });                
      })
})
}