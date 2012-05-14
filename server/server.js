var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var session = require('sesh').magicSession();

var write = require('./write');
var workspace = require('./workspace');
var openid = require('./openidLogin');
//var register = require('./register');
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
//        if (newSession) console.log(typeof(data) + '-' + JSON.stringify(data));
        response.writeHead(200, {'content-type': 'text/json' });
        response.write( JSON.stringify(data) );
        response.end('\n');
    };

//    var serveFile = function(dir, request, response, mod) {
//        request.addListener('end', function () {
//            dir.serve(request, response, mod); // Serve files!
//        });
//    };
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
            //} else if (command === '/read') {
                // read file and return contents to client
             //   fs.readFile(workspace.getBase(user) + '/' + postValue.filename, 'utf8', function (err, data) {
             //       if (err) {
             //           console.log('Read failed on ' + postValue.filename);
             //           throw err;
             //       }
            //        writeData({ contents : data });
            //    });
           // } else if (command === '/write') {
                //write.run(user, postValue, writeData);
//            } else if (command === '/jstree') { 
//                jstree.run(user, postValue, writeData);
//            } else if (command === '/phonegapCreate') { 
//                phonegapCreate.run(user, postValue, writeData);
//            } else if (command === '/projectImport') { 
//                projectImport.run(user, postValue, writeData);
//            } else if (command === '/build') { 
//                build.run(user, postValue, user, writeData);
//            } else if (command === '/unzip') { 
//                unzip.run(user, postValue, writeData);
//            } else if (command === '/template') { 
//                template.run(writeData);
//            } else if (command === '/getBanner') { 
//                banner.run(writeData);
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
//        if (command === '/download' && !isGuest) { // TODO !isGuest case for download // for now use connection.post('/setSession');
//            download.run(user, parsedUrl.query, response);   // filename is query
//        } else if (command === '/downloadApk') {
//            var qu = parsedUrl.query;
//            var ses = qu.substring(qu.lastIndexOf('=') + 1); // q.session may have special char like '+' that dont get thru
//            console.log(JSON.stringify(q) + '--' + parsedUrl.query + '--' + ses);
//            if (connectionDb.check(q.user, ses)) {
                // download from app doesn't have same session so validate with value from getApks
//                download.run(q.user, '/' + q.file, response);
//            } else {
//                console.log('/downloadApk failure for ' + q.user);
                // todo failure
//                writeData({});
//            }
//        } else if (command === '/downloadDemoApk') {
//            console.log(JSON.stringify(q) + '--' + parsedUrl.query);
//           download.run('demo', '/' + q.file, response);
      //  } else 
        if (command === '/getSharedItems') {
            console.log("command: /getSharedItems");
            if (isGuest) {
                writeData({ success : false }); // for debug
            } else {
                shareIdDb.getSharedItems(user, writeData);                 
            }
      //  } else if (command === '/getProjects') {
      //      if (isGuest && !resetSession(request, q.user, q.session, writeData)) return;
      //      getWorkspace.projects(user, writeData);
 //           console.log(user + ": /getProjects");
//            getWorkspace.projects('demo', writeData);
 //           console.log(user + ": /getProjects");
//        } else if (command === '/getApks') { 
//            if (isGuest && !resetSession(request, q.user, q.session, writeData)) return;
//            getWorkspace.apks(user, request.session.id, writeData);
//            console.log(user + ": /getApks");
//        } else if (command === '/getDemoApks') { 
//            getWorkspace.apks('demo', request.session.id, writeData);
//            console.log(user + ": /getApks");
        } else if (command === '/getConnection') {
            writeData({ user : user, session : request.session.id});
        } else if (command === '/openidAuth') {
            openid.authenticate(response, q);
        } else if (command === '/verify') {
            openid.verify(request, response);
            //console.log("after .verify: request=" + request + " response=" + response);
//        } else if (command === '/register') { 
//            var userid = q.userid;
//            console.log('register: ' + userid + '--' + q.email);
 //           register.run(request, q, writeData);
//        } else if (command.search('/runProject') === 0 && !isGuest) {
//            request.url = request.url.replace('/runProject','/' + user);
//            console.log(request.url);
//            serveFile(workspaceRoot, request, response);
//        } else if (command.search('/runDemoProject') === 0) {
//            request.url = request.url.replace('/runDemoProject','/demo');
//            console.log(request.url);
//            serveFile(workspaceRoot, request, response);
//        } else if (command.search('/runWeinre') === 0 && !isGuest) {
//            var weinreLink = null;
//            request.url = request.url.replace('/runWeinre','/' + user);
//            if (request.url.indexOf('assets/www/index.html') > 0) {
//                exec("touch " + workspace.getRoot() + request.url); // force reload - weinre may have switched
//                weinreLink = myUrl.getUrl() + ':' + myUrl.getPort() + '/weinre/target/target-script-min.js#' + user; 
//                console.log(request.url + '--' + weinreLink);
//            }
//            serveFile(workspaceRoot, request, response, weinreLink);
//        } else if (command.search('/workspace') === 0 && !isGuest) {
//            // file server for user created files
//            request.url = request.url.replace('/workspace','/' + user);
//            serveFile(workspaceRoot, request, response);           
//        } else {
//            serveFile(file, request, response);
        }
    }
}).listen(myUrl.getPort());
console.log("server initialized");