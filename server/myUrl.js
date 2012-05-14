// Server URL definition

var rawUrl = '192.168.0.107';
var url = 'http://' + rawUrl;

var port = 8012;

exports.getRawUrl = function() {
    return rawUrl;
};

exports.getUrl = function() {
    return url;
};

exports.getPort = function() {
    return port;
};

