var path = require('path'),
    inherit = require('inherit'),
    vowNode = require('vow-node'),
    YDisk = require('../ydisk'),
    SendSimple = require('./simple');

module.exports = inherit(SendSimple, {

    _ydisk: undefined,
    __constructor: function (options) {
        this._ydisk = new YDisk(options);
    },

    execute: function (master, data) {
        return this.__base(master, data)
            .then(function (data) {
                return this._sendToDisk(master, data);
            }, this);
    },

    getName: function () {
        return 'ydisk';
    },

    _sendToDisk: function (master, data) {
        var name = data.snapshotName,
            snapshotDir = master.getPather().getSnapshotDir(name),
            destinationPath = path.join(this._ydisk.getNamespace(), name);

        return vowNode.promisify(this._ydisk.getDisk()['uploadDir'])
            .call(this._ydisk.getDisk(), snapshotDir, destinationPath);
    }
});
