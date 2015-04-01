var inherit = require('inherit'),

    vow = require('vow'),
    vowNode = require('vow-node'),
    fsExtra = require('fs-extra'),

    CronRunner = require('cron-runner'),
    Logger = require('bem-site-logger'),

    utility = require('./util'),
    Pather = require('./pather'),
    Send = require('./send'),
    SymlinkSimple = require('./symlink/simple'),
    SymlinkDisk = require('./symlink/ydisk'),
    SendChanges = require('./send-changes');

module.exports = inherit([CronRunner, Logger], {

    _logger: undefined,
    _pather: undefined,
    _sendTask: undefined,
    _symlinkTask: undefined,
    _sendChangesTask: undefined,

    __constructor: function (options) {
        this.__base(options);

        this._options = options;

        this._logger = Logger.setOptions(this._options.logger).createLogger(module);

        if (!this._options.path) {
            throw new Error('Absolute path to snapshots directory was not set');
        }

        this._pather = new Pather(this._options.path);

        if (!this._options.symlinks) {
            this._logger.warn('Existed "symlinks" option was not set. Default "symlinks" options will be set');
            this._options.symlinks = this.__self.DEFAULT.SYMLINKS;
        }

        if (!this._options['yandex-disk']) {
            this._logger.warn('Yandex Disk options were not set. Snapshots will not be sent to Yandex Disk');
            this._sendTask = {
                getName: function () { return 'simple'; },
                execute: function (data) { return vow.resolve(data); }
            };
            this._symlinkTask = new SymlinkSimple(this._options);
        } else {
            this._sendTask = new Send(this._options);
            this._symlinkTask = new SymlinkDisk(this._options);
        }

        if (!this._options['e-mail']) {
            this._logger.warn('E-Mail options were not set');
            this._sendChangesTask = {
                execute: function (data) {
                    return vow.resolve(data);
                }
            };
        } else {
            this._sendChangesTask = new SendChanges(this._options);
        }
    },

    /**
     * Build target stub function
     * It should be replaced in child modules
     * @returns {{getChanges: Function}}
     */
    buildTarget: function () {
        return vow.resolve({
            getChanges: function () {
                return {
                    areModified: function () {
                        return true;
                    }
                };
            }
        });
    },

    /**
     * Overrides cron execution function
     * 1. Builds data
     * 2. Check if data was changed
     * 3. If data was changed then:
     *  3.1 Creates new data snapshot
     *  3.2. Optionally sends it to Yandex Disk
     *  3.3 Switches all configured symlinks to this snapshot
     *  3.4 Sends snapshot data changes via e-mail
     * @returns {*}
     */
    execute: function () {
        this._logger.info('-- snapshot master execute start --');
        return this.buildTarget()
            .then(function (buildResult) {
                if (!buildResult.getChanges().areModified()) {
                    this._logger.info('No changes were collected during this data rebuild iteration');
                    return false;
                }
                var name = utility.buildSnapshotName(); // generates name of snapshot (based on current date)
                return vow.resolve({ buildResult: buildResult, snapshotName: name })
                    .then(this._createSnapshot.bind(this)) // Creates new data snapshot
                    .then(this._sendTask.execute.bind(this._sendTask)) // Optionally sends it to Yandex Disk
                    .then(this._symlinkTask.execute.bind(this._symlinkTask)) // Switches all configured symlinks to this snapshot
                    .then(this._sendChangesTask.execute.bind(this._sendChangesTask)) // Sends snapshot data changes via e-mail
                    .then(function () {
                        return true;
                    });
            }, this)
            .then(function (result) {
                this._logger.info('-- snapshot master execute end --');
                return result;
            }, this);
    },

    /**
     * Creates new snapshot
     * @param {Object} data object with fields:
     * - {Object} buildResult - result of data building. Have methods for retrieving changes model
     * - {String} snapshotName - name of snapshot
     * @returns {*}
     * @private
     */
    _createSnapshot: function (data) {
        var buildResult = data.buildResult,
            name = data.snapshotName,
            meta = { date: name, changes: buildResult.getChanges() };

        this._logger.info('_createSnapshot: %s', name);
        this._logger.debug('_createSnapshot: make snapshot directory %s', this._pather.getSnapshotDir(name));

        // makes snapshot directory
        return vowNode.promisify(fsExtra.mkdirs)(this._pather.getSnapshotDir(name))
            .then(function () {
                var srcPath = this._pather.getDbDir(),
                    dstPath = this._pather.getSnapshotDbDir(name),
                    dataPath = this._pather.getSnapshotDataFile(name),
                    copyBase = vowNode.promisify(fsExtra.copy)(srcPath, dstPath), // copies all database files
                    writeData = vowNode.promisify(fsExtra.writeJSON)(dataPath, meta); // create data.json file

                return vow.all([copyBase, writeData]);
            }, this)
            .then(function () {
                return data;
            });
    }
}, {
    DEFAULT: {
        SYMLINKS: ['testing'] // default set of environment symlinks
    }
});
