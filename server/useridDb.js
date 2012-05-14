// Manage userid database

var db = require('dirty')('userid.db');
var workspace = require('./workspace');
var preRegister = [];  // hold logins that are not yet registered

db.on('load', function() {
    console.log('userid.db loaded');
});

// Don't need session here
exports.register = function(claimedId, session, email) {
    var userid = db.get(claimedId);
    //console.log('---> .register :' + claimedId + '-' + userid + '-' + session + ' - ' + email);
    console.log('---> .registering new user');
    if (!userid) {
        // if no userid, create it an insert
        // remove preRegister[session] = { claimedId : claimedId, email : email} ;
        var username = email.split("@")[0];
        userid = username.replace(/\./g, "").toLowerCase();
        //console.log('---> userid=' + userid);
        db.set(claimedId, userid);    
        workspace.initWorkspace(userid);
    }
    return userid;
};

/*exports.getOrPreRegister = function(claimedId, session, email) {
    var userid = db.get(claimedId);
    console.log('useridDB get vals:' + claimedId + '-' + userid + '-' + session + ' - ' + email);
    if (!userid) {
        preRegister[session] = { claimedId : claimedId, email : email} ;
    }
    return userid;
};*/

/*exports.insert = function(userid, session) {
    var data = preRegister[session];
    if (!data) {
        console.log('useridDB: mismatched sessions in insert:' + userid + '-' + session);
        return null;
    }     
    var claimedId = data.claimedId;
//    console.log('useridDB insert vals:' + claimedId + '-' + userid + '-' + session);
    db.set(claimedId, userid);
    delete preRegister[claimedId];
    return data.email;
};*/