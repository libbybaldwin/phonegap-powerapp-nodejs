if (global.GENTLY) require = GENTLY.hijack(require);

var fs = require('fs'),
sys = require('sys'),
EventEmitter = require('events').EventEmitter;

var DD = exports.DD = function(path) {
    if (!(this instanceof DD)) return new DD(path);
    EventEmitter.call(this);
    this.path = path;

    this._docs = {};
    this._readStream = null;
    this._load();
};

sys.inherits(DD, EventEmitter);
DD.DD = DD;
module.exports = DD;

DD.prototype.set = function(key, val) {
    if (val === undefined) {
        delete this._docs[key];
    } else {
        this._docs[key] = val;
    }
    this._flush();
};

DD.prototype.get = function(key) {
    return this._docs[key];
};

DD.prototype.rm = function(key, cb) {
    this.set(key, undefined, cb);
};

DD.prototype.forEach = function(fn) {
    for (var key in this._docs) {
        if (fn(key, this._docs[key]) === false) {
            break;
        }
    }
};

DD.prototype._load = function() {
    var self = this, buffer = '', length = 0;

    if (!this.path) {
        process.nextTick(function() {
            self.emit('load', 0);
        });
        return;
    }

    this._readStream = fs.createReadStream(this.path, {
        encoding: 'utf-8',
        flags: 'r'
    });

    this._readStream
    .on('error', function(err) {
        if (err.code === 'ENOENT') {
            self.emit('load', 0);
            return;
        }

        self.emit('error', err);
    })
    .on('data', function(chunk) {
        buffer += chunk;
        if (chunk.lastIndexOf('\n') == -1) return;
        var arr = buffer.split('\n');
        buffer = arr.pop();
        arr.forEach(function(rowStr) {
            if (!rowStr) {
                self.emit('error', new Error('Empty lines never appear in a healthy database'));
                return
            }
            try {
                var row = JSON.parse(rowStr);
                if (!('key' in row)) {
                    throw new Error();
                }
            } catch (e) {
                self.emit('error', new Error('Could not load corrupted row: '+rowStr));
                return '';
            }

            if (row.val === undefined) {
                if (row.key in self._docs) {
                    length--;
                }
                delete self._docs[row.key];
            } else {
                if (!(row.key in self._docs)) {
                    length++;
                }
                self._docs[row.key] = row.val;
            }
            return '';
        });
    })
    .on('end', function() {
        if (buffer.length) {
            self.emit('error', new Error('Corrupted row at the end of the db: '+buffer));
        }
        self.emit('load', length);
    });
};


DD.prototype._flush = function() {
    var self = this,
    bundleLength = 0,
    bundleStr = '',
    key,
    cbs = [];

    for (var key in this._docs) {
        if (Array.isArray(key)) {
            cbs.push(key[1]);
            key = key[0];
        }
        bundleStr += JSON.stringify({key: key, val: this._docs[key]})+'\n';
    }

    var writeStream = fs.createWriteStream(this.path, {  encoding: 'utf-8'  });

    writeStream.write(bundleStr, function(err) {
        if (err) {
            self.emit('error', err);
            return;
        }
    });

    this.emit('drain');
};
