var fs = require('fs'),
    zlib = require('zlib'),
    vow = require('vow'),
    vowNode = require('vow-node'),
    inherit = require('inherit'),
    tar = require('tar'),
    fstream = require('fstream'),
    fsExtra = require('fs-extra'),

    Logger = require('bem-site-logger'),
    Pather = require('../pather');

module.exports = inherit({
    _logger: undefined,
    _pather: undefined,

    __constructor: function (options) {
        this._pather = Pather.create(options.path);
        this._logger = Logger.setOptions(options['logger']).createLogger(module);
    },

    /**
     * Executes current task
     * @param {Object} data object with fields:
     * - {Object} buildResult - result of data building. Have methods for retrieving changes model
     * - {String} snapshotName - name of snapshot
     * @returns {*}
     */
    execute: function (data) {
        this._logger.info('_sendSnapshot: %s', data.snapshotName);
        return vow.resolve(data)
            .then(this._createDbArchive.bind(this))
            .then(this._removeDbFolder.bind(this));
    },

    /**
     * Returns name of current task
     * @returns {String}
     */
    getName: function () {
        return 'simple';
    },

    /**
     * Creates archive from snapshot database folder
     * @param {Object} data object with fields:
     * - {Object} buildResult - result of data building. Have methods for retrieving changes model
     * - {String} snapshotName - name of snapshot
     * @returns {*}
     * @private
     */
    _createDbArchive: function (data) {
        var _this = this,
            def = vow.defer(),
            dbDir = this._pather.getSnapshotDbDir(data.snapshotName);

        this._logger.debug('_createDbArchive: for folder %s', dbDir);

        fstream.Reader({ path: dbDir, type: 'Directory' })
            .pipe(tar.Pack())
            .pipe(zlib.Gzip())
            .pipe(fs.createWriteStream(dbDir + '.tar.gz'))
            .on('error', function (err) {
                _this._logger.error('_createDbArchive: Error %s', err.message);
                def.reject(err);
            })
            .on('close', function () {
                _this._logger.debug('_createDbArchive: Success');
                def.resolve(data);
            })
            .on('end', function () {
                _this._logger.debug('_createDbArchive: Success');
                def.resolve(data);
            });
        return def.promise();
    },

    /**
     * Removes database folder
     * @param {Object} data object with fields:
     * - {Object} buildResult - result of data building. Have methods for retrieving changes model
     * - {String} snapshotName - name of snapshot
     * @returns {*}
     * @private
     */
    _removeDbFolder: function (data) {
        var dbDir = this._pather.getSnapshotDbDir(data.snapshotName);
        this._logger.debug('_removeDbFolder: %s', dbDir);
        return vowNode.promisify(fsExtra.remove)(dbDir).then(function () {
            this._logger.debug('_removeDbFolder: Success');
            return data;
        }, this);
    }
});
