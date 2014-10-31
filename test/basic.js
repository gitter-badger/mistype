var Code = require('code'),
	Lab = require("lab"),
    server = require("../"),
    lab = exports.lab = Lab.script()

lab.test("Noop", function(done) {
    done()
})

lab.test("Landing", function(done) {
	var options = {
        method: "GET",
        url: "/"
    }
 
    server.inject(options, function(response) {
        var result = response.result
 
        Code.expect(response.statusCode).to.equal(200)
        Code.expect(result).to.be.string()
        Code.expect(result).to.include('Mistype')
 
        done()
    })
})