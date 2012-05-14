// Manage userid database

var db = require('dirty')('userid.db');
var workspace = require('./workspace');

db.on('load', function() {
    console.log('userid.db loaded');
});

exports.register = function(claimedId, session, email) {
    var userid = db.get(claimedId);
    //console.log('---> .register :' + claimedId + '-' + userid + '-' + session + ' - ' + email);
    console.log('---> .registering new user');
    if (!userid) {
        var username = email.split("@")[0];
        userid = username.replace(/\./g, "").toLowerCase();
        //console.log('---> userid=' + userid);
        db.set(claimedId, userid);    
        workspace.initWorkspace(userid);
    }
    return userid;
};
