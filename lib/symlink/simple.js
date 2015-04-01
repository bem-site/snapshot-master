var fs = require('fs'),
    _ = require('lodash'),
    inherit = require('inherit'),
    vow = require('vow'),
    vowNode = require('vow-node'),
    fsExtra = require('fs-extra'),

    Logger = require('bem-site-logger'),
    Pather = require('../pather');

module.exports = inherit({
    _options: undefined,
    _logger: undefined,
    _pather: undefined,

    __constructor: function (options) {
        this._options = options;
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
        this._logger.info('_setSymlink: %s', data.snapshotName);

        // for every of configured symlinks we should:
        // 1. Remove previous symlink
        // 2. Set symlink for current snapshot
        var name = data.snapshotName,
            symlinks = _.chain(this._options['symlinks'])
                .map(function (item) {
                    return this._pather.getSymlink(item);
                }, this)
                .map(function (item) {
                    var srcPath = this._pather.getSnapshotDir(name);
                    return vowNode.promisify(fsExtra.remove)(item)
                        .then(function () {
                            this._logger.debug('_setSymlink: make symlink %s %s', srcPath, item);
                            return vowNode.promisify(fs.symlink(srcPath, item, 'dir'));
                        }, this);
                }, this)
                .value();

            return vow.all(symlinks).then(function () {
                this._logger.debug('_setSymlink: Success');
                return data;
            }, this);
    },

    /**
     * Returns name of current task
     * @returns {String}
     */
    getName: function () {
        return 'simple';
    }
});
