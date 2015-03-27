var path = require('path'),
    _ = require('lodash'),
    inherit = require('inherit'),
    vow = require('vow'),
    vowNode = require('vow-node'),
    YDisk = require('../ydisk'),
    SymlinkSimple = require('./simple');

module.exports = inherit(SymlinkSimple, {

    _ydisk: undefined,

    __constructor: function (options) {
        this._ydisk = new YDisk(options);
    },

    execute: function (master, data) {
        return this.__base(master, data)
            .then(function (data) {
                var name = data.snapshotName,
                    symlinks = _.chain(master.getOptions()['symlinks'])
                        .map(function (item) {
                            var destinationPath = path.join(this._ydisk.getNamespace(), item);
                            return vowNode.promisify(this._ydisk.getDisk()['writeFile'])
                                .call(this._ydisk.getDisk(), destinationPath, name, 'utf-8');
                        }, this)
                        .value();

                return vow.all(symlinks).then(function () { return data; });
            }, this);
    },

    getName: function () {
        return 'ydisk';
    }
});
