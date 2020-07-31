var request = require('supertest')
describe('loading express', function() {
    var server
    beforeEach(function() {
        delete require.cache[require.resolve('../dbActions/index')];
        server = require('../dbActions/index')
    })
    afterEach(function(done) {
        server.close(done)
    })
    it('responds to /', function testSlash(done) {
        request(server)
            .get('/')
            .expect(200, done)
    })
    it('responds to /loadPlace', function testLoadPlace(done) {
        request(server)
            .post('/loadPlace')
            .set('Content-Type','application/json')
            .send('{"placeId":0}')
            .expect(200, '[{"title":"A Formless Void","description":"Nothingness stretches in all directions.   There is no sense of up, down, or anything.  It is everything at all times.  "}]', done)
    })
})