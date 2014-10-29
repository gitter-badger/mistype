var Hapi = require('hapi'),    
    Good = require('good'),
    Joi =  require('joi'),
    Path = require('path'),
    Url = require('url')
    Datastore = require('nedb')
    //Notifier = require('./notifier.js')


var server = new Hapi.Server(80)

server.views({
    engines: {
        html: require('handlebars')
    },
    path: Path.join(__dirname, 'templates')
})

var Typos = new Datastore({
    filename: 'db/typos',
    autoload: true
})

var Users = new Datastore({
    filename: 'db/users',
    autoload: true
})

server.route({
    method: 'GET',
    path: '/',
    handler: function(request, reply){
        reply.view('landing')
    }
})


server.route({
    method: 'GET',
    path: '/domain/{domain}',

    handler: function(request, reply) {
        if (request.params.domain.indexOf('.') !== -1) {
            Typos.find({owner: request.params.domain}, function(err, typos) {
                if (err) throw Error()
                    reply.view('list', {typos: typos})
            })
        }
        else {
            server.log('info', '/domain/ request without dot')
            reply.redirect('/')
        }
    },

    config: {
        validate: {
            params: {
                domain: Joi.string().hostname()
            }
        }
    }
})

server.route({
    method: 'GET',
    path: '/see/{owner}',
    handler: function(request, reply){
        console.log(request.params.owner.toString())
        Typos.find({owner: request.params.owner}, function(err, typos) {
            if (err) throw Error()
            reply.view('list', {typos: typos})
        })
    }
})

server.route({
    method: 'POST',
    path: '/oh',
    handler: function(request, reply){
        var typo = {
            owner: request.payload.owner,
            text: request.payload.text,
            classes: request.payload.classes,
            tag: request.payload.tag,
            url: request.payload.url,
            day: new Date(),
            domain: Url.parse(request.payload.url).hostname,
            additional: request.payload.additional || null
        }

        Typos.insert(typo, function(err, savedTypo) {
            console.log('fukken saved:', savedTypo)
            //Notifier.update({owner: savedTypo.owner, typoId: savedTypo._id})
            reply(savedTypo)
        })
    }
})

server.route([
    {
        method: 'GET',
        path: '/js',
        handler: function(request, reply) {
            reply.file('typo.js')
        }
    },
    {
        method: 'GET',
        path: '/css',
        handler: function(request, reply) {
            reply.file('typo.css')
        }
    }
])

server.route({
    method: 'GET',
    path: '/public/{filename}',
    handler: function(request, reply) {
        reply.file(Path.join(__dirname, 'public', request.params.filename))
    }
})

server.pack.register(Good, function (err) {
    if (err) {
        throw err
    }

    server.start(function () {
        server.log('info', 'Server of Mistype is running at: ' + server.info.uri)
    })
})