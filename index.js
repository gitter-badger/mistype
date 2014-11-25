
var nconf = require('nconf'),
    Hapi = require('hapi'),    
    Good = require('good'),
    Joi =  require('joi'),
    Path = require('path'),
    Url = require('url');

nconf.defaults({'port': 8080})
     .argv()
     .env()
     .file({ file: 'local.json' });

var mailgun = require('mailgun');
    nano = require('nano')(nconf.get('couchurl')),

mg = new mailgun.Mailgun(nconf.get('mailgunkey'));

var server = new Hapi.Server(nconf.get('port'), {cors: true})

var sendEmail = function(change) {
    var mistype = change.doc;
    users.get(mistype.owner, function(err, doc){
        if (err) {
            server.log('error searching user:' + mistype.owner, err)
        }
        else {
            mg.sendText(
                'robots@mistype.co', 
                doc.email,
                'Hey, mistype at ' + mistype.url,
                'Some user tells that at ' + mistype.url + ' mistype is hiding!\n\nThere it is:\n'+mistype.text+'\nelement + class list: ' + mistype.tag + ' '+ mistype.classes + (mistype.additional ? '\nAdditional info: ' + mistype.additional : '') + '\nReported at ' + mistype.day +'\n\n\nHope you\'ll fix it soon,\nMistype\'s robots'
                )
            logs.insert({type: 'notification', to: doc}, function(err, doc) {
                if (err) console.log('error in logging access to js', err)
            })
        }
    })
}

var mistypes = nano.use('mistypes');
console.log('mistypes ok');
var users = nano.use('users');
console.log('users ok');
var logs = nano.use('logs');
console.log('logs ok');

var feed = mistypes.follow({since: 'now', include_docs: true})

feed.on('change', sendEmail)
feed.follow()
console.log('follow ok')

var addUser = function(email, reply) {
    users.insert({email: email}, function(err, smth){
        if (err) {
            server.log('error at adding user', err)
            logs.insert({type: 'error', error: err}, function(err0, doc) {
                if (err0) console.log('error in logging error -_-', err)
            })
        }
        else {
            reply.view('step2', {id: smth.id})
        }
    })
}

var addMistype = function(typo, retry) {
    mistypes.insert(typo, function(err, savedTypo) {
        if (err) {
            server.log('error at adding mistype:', err)
            if (retry < 5) {
                setTimeout(addMistype.bind(typo, retry + 1), 1000)
            }
        }
    })
}


server.views({
    engines: {
        html: require('handlebars')
    },
    path: Path.join(__dirname, 'templates')
})



server.route([
    {
        method: 'GET',
        path: '/',
        handler: function(request, reply){
            reply.view('step1')
        }
    },

    {
        method: 'GET',
        path: '/faq',
        handler: function(request, reply){
            reply.view('faq')
        }
    }
])




server.route ([
    {
        method: 'POST',
        path: '/user',
        handler: function(request, reply){
            addUser(request.payload.email, reply)
        }
    },
    {
        method: 'GET',
        path: '/user',
        handler: function(request, reply) {
            reply.redirect('/')
        }
    }
])

server.route({
    method: 'POST',
    path: '/oh',
    handler: function(request, reply){
        reply(true)

        var typo = {
            owner: request.payload.owner || 'nobody',
            text: request.payload.text ,
            classes: request.payload.classes,
            tag: request.payload.tag,
            url: request.payload.url,
            day: new Date(),
            domain: Url.parse(request.payload.url).hostname,
            additional: request.payload.additional || null
        }

        addMistype(typo)
    },
    config: {
        /*validate: {
            payload: {
                owner: Joi.string().min(1).required(),
                text: Joi.string().min(1).required(),
                url: Joi.string().min(1).required()
            }
        }*/
    }
})

server.route([
    {
        method: 'GET',
        path: '/js',
        handler: function(request, reply) {
            reply.file('typo.js')
            logs.insert({type: 'access', headers: request.headers}, function(err, doc) {
                if (err) console.log('error in logging access to js', err)
            })
        }
    },
    {
        method: 'GET',
        path: '/css',
        handler: function(request, reply) {
            reply.file('typo.css')
        }
    },
    {
        method: 'GET',
        path: '/public/{filename}',
        handler: function(request, reply) {
            reply.file(Path.join(__dirname, 'public', request.params.filename))
        }
    }
])

server.pack.register(Good, function (err) {
    if (err) {
        throw err
    }

    if (!module.parent) {
        server.start(function() {
            server.log("Server started", server.info.uri);
        });
    }
})

process.on('uncaughtException', function (err) {
    console.log('uncaughtException!!', err)
});

module.exports = server