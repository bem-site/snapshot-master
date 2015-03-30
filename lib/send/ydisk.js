var path = require('path'),
    inherit = require('inherit'),
    vowNode = require('vow-node'),
    YDisk = require('../ydisk'),
    SendSimple = require('./simple');

module.exports = inherit(SendSimple, {

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
        return this.__base(data).then(this._sendToDisk.bind(this));
    },

    /**
     * Returns name of current task
     * @returns {String}
     */
    getName: function () {
        return 'ydisk';
    },

    _sendToDisk: function (data) {
        var name = data.snapshotName,
            snapshotDir = this._pather.getSnapshotDir(name),
            destinationPath = path.join(this._ydisk.getNamespace(), name);

        this._logger.debug('_sendToDisk: from %s', snapshotDir);
        this._logger.debug('_sendToDisk: to %s', destinationPath);

        return vowNode.promisify(this._ydisk.getDisk()['uploadDir'])
            .call(this._ydisk.getDisk(), snapshotDir, destinationPath)
            .then(function () {
                this._logger.debug('_sendToDisk: Success');
                return data;
            }, this);
    }
});
