// Manage share id database and share functions
// Key is username, value is current share id
// Used to anonymously share item data in shared dir sharedItems

var fs = require('fs');
var path = require('path');
var write = require('./write');
var workspace = require('./workspace');
var copymove = require('./copymove');
var db = require('dirty').dirtydirty('sharedid.db');

var currentIdKey = ".currentShareId";
var shareDir = "shared-items";
    
db.on('load', function() {
    console.log('sharedid.db loaded');
    var id = db.get(currentIdKey);
    if (!id) { 
        console.log("--no currentShareId, creating"); 
        db.set(currentIdKey, 100);
    } else {
        console.log("--currentShareId=" + id);        
    }
});

exports.getShareId = function(user) {
    var shareId = db.get(user);
    if (!shareId) {
        return 0;
    }
    //console.log("getShareId user: " + user + " shareId: " + shareId);
    return shareId;
}

exports.getSharedItems = function (user, callback) {
    var shareId = exports.getShareId(user);
    if (!shareId) {
        //console.log("getSharedItems failed: user: " + user + " is not in sharedIdDb");
        console.log("getSharedItems failed: user is not in sharedIdDb");
        callback({success : false});
        return;
    } else {
        //console.log("getSharedItems for shareId=" + shareId);
        var workspaceRoot = workspace.getRoot();
        var sharedBase = workspaceRoot + shareDir;
        var returnData = [];
        var callbackCountdown = 0;
            
        var registerDone = function() {
            callbackCountdown -= 1;
            if (callbackCountdown === 0) {
                if (returnData.length === 0) {
                    callback({ success : false, error : 'No Shared Items found.' });
                } else {
                    callback({ success : true, list : returnData });
                }
            } else if (returnData.length === 30) {
                callback({ success : true, list : returnData });
            }
        };
            
        var selectShared = function(f) {
            if (f.indexOf(shareId) !== 0) {
                //console.log("shared dir shareId=" + shareId + ": file = " + f);
                fs.readFile(sharedBase + '/' + f, 'utf8', function (err, data) {
                    if (err) {
                        console.log('Read failed on ' + postValue.filename);
                        throw err;
                    }
                    var item = JSON.parse(data);
                    //console.log("readFile item.scancode: " + item.scancode);
                    // We are not sharing timestamp of shared items. // time : item.time,
                    returnData.push({ item : item.scancode, loc : item.loc,
                                      rating: item.rating, comment : item.comment });
                    registerDone();
                });
            } else { // skip files with this user's shareId
                registerDone();
            }
        };
            
        fs.readdir(sharedBase, function(err, files) {
            if (err) {
                console.log('Shared directory read error ' + sharedBase);
                throw err;
            }
            var i, count;
            callbackCountdown = files.length;
            if (callbackCountdown === 0) {
                callback({ success : false, error : 'No Shared Items found.' });
            } else {
                for (i = 0; i < files.length; i++) {
                    selectShared(files[i]);
                }
            }
        });
    }
}

// Share or unshare, depending on value of 'share' param.
// Share gives user share id and copies user's items to shared-items/
// Unshare removes user's items from shared-items/ and user from sharedid.db
exports.setShare = function(user, share, callback) {   
    var shareVal = (share === 'true') ? true : false;
    if (shareVal) {
        var currentId = db.get(currentIdKey);
        if (!currentId) {
            console.log("setShare: error getting id, check shareIdDb");
            callback({ success : false });
        }
        currentId++; // increment currentId before assigning to user
        db.set(currentIdKey, currentId); // update currentIdKey
        db.set(user, currentId); // set new currentId for this user
        //console.log("setShare: user=" +  user + " : currentId=" + currentId);
        exports.copyItems(user, currentId, callback);
    } else {
        var userId = db.get(user);
        if (!userId) {
            console.log("sharedIdDb could not get id for user: " + user);
            callback({ success : false });
        }
        // console.log("unset Share: user=" + user + " id=" + userId);
        db.rm(user);
        exports.removeItems(userId, callback);
    }
};

exports.copyItems = function(user, id, callback) {
    var userBase = workspace.getBase(user);
    var workspaceRoot = workspace.getRoot();
    var sharedBase = workspaceRoot + shareDir;
    var callbackCountdown = 0;
    
    var registerDone = function() {
        callbackCountdown -= 1;
        if (callbackCountdown === 0) {
            callback({ success : true });
        }
    };

    var copyFile = function(filename) {
        //console.log("copyFile test dirs: --" + userBase + "/" + filename + "--  --" + sharedBase + "/" + id + "." + filename);
        copymove.copy(user, [userBase + "/" + filename, sharedBase + "/" + id + "." + filename ], function (data) {
            if (!data.success) {
                console.log( "sharedIdDb: Error copying to shareDir " + filename + ". error: " + data.error);
            }
        });
        registerDone();
    };
    
    fs.readdir(userBase, function(err, files) {
        if (err) {
            console.log('shareIdDb.copyItems directory read error ' + userBase);
            throw err;
        }
        var i;
        callbackCountdown = files.length;
        if (callbackCountdown === 0) {
            callback({ success : true });
        } else {
            for (i = 0; i < files.length; i++) {
                copyFile(files[i]);
            }
        }
    });    
};

exports.removeOneItem = function(user, filename, callback) {
    var userBase = workspace.getBase(user);
    var workspaceRoot = workspace.getRoot();
    var sharedBase = workspaceRoot + shareDir;
    var shareId = exports.getShareId(user);

    //console.log("removeOneItem : " + userBase + " : " + sharedBase + " : " + filename)
    path.exists(userBase + '/' + filename, function(exists) {
        if (exists) {
            fs.unlink(userBase + "/" + filename, function(err) { 
                if (err) { console.log('removeOneItem error: ' + err); }
                // remove share version
                if (shareId) {
                    path.exists(sharedBase + '/' + shareId + '.' + filename, function(exists) {
                        if (exists) {
                            fs.unlink(sharedBase + '/' + shareId + '.' + filename, function(err) { 
                                if (err) { console.log('removeOneItem shared error: ' + err); }
                                callback( { success : true } );
                            });
                        } else { 
                            callback( { success : false } ); // shared filename doesn't exist
                        }
                    });
                } else {
                    callback( { success : true } );
                }
            });
        } else { 
            callback( { success : false } ); // filename doesn't exist
        }
    });
};

exports.removeItems = function(id, callback) {
    var workspaceRoot = workspace.getRoot();
    var sharedBase = workspaceRoot + shareDir;
    var callbackCountdown = 0;
    
    var registerDone = function() {
        callbackCountdown -= 1;
        //console.log("callbackCountdown: " + callbackCountdown);
        if (callbackCountdown === 0) {
            callback({ success : true });
        }
    };

    var removeFile = function(filename) {
        //console.log("removeFile : --" + sharedBase + "/" + filename);
        fs.unlink(sharedBase + "/" + filename, function(err) { 
            if (err) { console.log('shareIdDb.removeItems :' + err); }
            registerDone();
        });
    };
    
    fs.readdir(sharedBase, function(err, files) {
        if (err) {
            console.log('shareIdDb.removeItems directory read error ' + sharedBase);
            throw err;
        }
        var i;
        callbackCountdown = files.length;
        if (callbackCountdown === 0) {
            callback({ success : true });
        } else {
            for (i = 0; i < files.length; i++) {
                if (files[i].indexOf(id + ".") === 0) {
                    removeFile(files[i]);
                } else {
                    registerDone();
                }
            }
        }
    });    
};