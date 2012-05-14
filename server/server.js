var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var session = require('sesh').magicSession();

var write = require('./write');
var workspace = require('./workspace');
var openid = require('./openidLogin');
var myUrl = require('./myUrl');
var connectionDb = require('./connectionDb');

var shareIdDb = require('./shareIdDb');

if (myUrl.getPort() === 80) {   // catch exceptions when in production
    console.log('catching exceptions');
    process.on('uncaughtException', function (err) {
        console.log('Uncaught error: ' + err);
    });
}

http.createServer(function(request, response){
    var newSession = null;
    
    var writeData = function(data) {
        if (newSession) {
            console.log('newSession is ' + newSession);
            if (data instanceof Array) {   // getChildren case
                data[0].newSession = newSession;
            } else {
                data.newSession = newSession;
            }
        }
        response.writeHead(200, {'content-type': 'text/json' });
        response.write( JSON.stringify(data) );
        response.end('\n');
    };

    resetSession = function(request, u, session, writeData) {
        //console.log(command + '--' + u + '--' + session);
        if (connectionDb.check(u, session, request.session.id)) {
            //console.log('setting new session for ' + u);
            request.session.data.user = u;
            user = u;
            newSession = request.session.id; // let client know about new session 
            return true;
        } else {
            writeData({ 'success' : false, 'loggedOut' : true, 'error' : 'Authentication failed. Please re-login.'});
            return false;
        }
    };
    
    var parsedUrl = url.parse(request.url);
    var command = parsedUrl.pathname; 
    var user = request.session.data.user;
    var isGuest = user === 'Guest';
    
    if (request.method === 'POST') {
        console.log("post command=" + command);
        //console.log("post command=" + command + " user=" + user);
        var body = '';
        request.on('data', function (data) {
            body += data;
        });
        request.on('end', function () {
            var postValue = qs.parse(body);
            if (isGuest && !resetSession(request, postValue.user, postValue.session, writeData)) return;
            if (command === '/setSession') {
                // only setting session - useful for client when connection.post cannot be used in place of post
                // and for app to update session
                writeData({});
            } else if (command === '/setItem') {
                console.log("command: /setItem : scancode=" + postValue.filename);
                //console.log("         /setItem : contents=" + postValue.contents);
                write.run(user, postValue, writeData);  // .filename .contents .saveas
            } else if (command === '/setShare') {
                //console.log("command: /setShare : user=" + user + " set share=" + postValue.share);
                shareIdDb.setShare(user, postValue.share, writeData);       
            } else if (command === '/removeItem') {
                //console.log("command: /removeItem : filename=" + postValue.filename);
                shareIdDb.removeOneItem(user, postValue.filename, writeData) 
            } else if (command === '/logout') { 
                //console.log('/logout ' + user + '--' + request.session.id);
                request.session.data.user = 'Guest';
                writeData({ success : connectionDb.remove(user, request.session.id) });
            } else {
                console.log('unrecognized post' + command);
            }
        });

    } else if (request.method === 'GET'){
        //console.log(command + '--' + request.url);
        var q = qs.parse(parsedUrl.query);

        if (command === '/getSharedItems') {
            console.log("command: /getSharedItems");
            if (isGuest) {
                writeData({ success : false }); // for debug
            } else {
                shareIdDb.getSharedItems(user, writeData);                 
            }
        } else if (command === '/getConnection') {
            writeData({ user : user, session : request.session.id});
        } else if (command === '/openidAuth') {
            openid.authenticate(response, q);
        } else if (command === '/verify') {
            openid.verify(request, response);
        }
    }
}).listen(myUrl.getPort());
console.log("server initialized");