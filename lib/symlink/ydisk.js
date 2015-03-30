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
        this.__base(options);
        this._ydisk = new YDisk(options['yandex-disk']);
    },

    /**
     * Executes current task
     * @param {Object} data object with fields:
     * - {Object} buildResult - result of data building. Have methods for retrieving changes model
     * - {String} snapshotName - name of snapshot
     * @returns {*}
     */
    execute: function (data) {
        return this.__base(data)
            .then(function (data) {
                var name = data.snapshotName,
                    symlinks = _.chain(this._options['symlinks'])
                        .map(function (item) {
                            var destinationPath = path.join(this._ydisk.getNamespace(), item);
                            return vowNode.promisify(this._ydisk.getDisk()['writeFile'])
                                .call(this._ydisk.getDisk(), destinationPath, name, 'utf-8');
                        }, this)
                        .value();

                return vow.all(symlinks).then(function () { return data; });
            }, this);
    },

    /**
     * Returns name of current task
     * @returns {String}
     */
    getName: function () {
        return 'ydisk';
    }
});
