// write writes out a file

var fs = require('fs');
var path = require('path');
var workspace = require('./workspace');
var shareIdDb = require('./shareIdDb');
var shareDir = "shared-items";

exports.doWriteAndShare = function(user, shareId, filename, contents, callback) {
    var outName = workspace.getBase(user) + '/' + filename;
    //console.log("doWriteAndShare outName:" + outName);
    if (shareId) { 
         var outShareName = workspace.getRoot() + shareDir + '/' + shareId + "." + filename;
         //console.log("doWriteAndShare outShareName:" + outShareName);

         fs.writeFile(outName, contents, 'utf8', function (err) {
             var data;
             if (err) {
                 console.log('Write failed on ' + outName);
                 data = { success : false };
                 callback(data);
             } else { 
                 fs.writeFile(outShareName, contents, 'utf8', function (err) {
                     if (err) {
                         console.log('Share write failed on ' + outShareName);
                         data = { success : false };
                     } else {                         
                         data = { success : true };
                     }
                     callback(data);
                 });
             }
         });                 
    } else {
        exports.doWrite(outName, contents, callback);
    }
};
    
exports.doWrite = function(outName, contents, callback) {
    fs.writeFile(outName, contents, 'utf8', function (err) {
        var data;
        if (err) {
            console.log('doWrite failed on ' + outName);
            data = { success : false };
        } else { 
            data = { success : true };
        }
        callback(data);
    });
};
    
exports.run = function(user, postValue, callback) {
    var filename = postValue.filename;
    var contents = postValue.contents;
    var shareId = shareIdDb.getShareId(user);
    
    if (postValue.saveas === 'true') {      
        var outName = workspace.getBase(user) + '/' + postValue.filename;
        // make sure the file doesn't exist
        path.exists(outName, function(exists) {
            if (exists) {
                callback( { success : false, ret : 'overwrite'} );
            } else { 
              exports.doWriteAndShare(user, shareId, filename, contents, callback);
            }
        });
    } else { 
        exports.doWriteAndShare(user, shareId, filename, contents, callback);
    }
};
    
