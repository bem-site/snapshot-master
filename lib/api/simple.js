var fs = require('fs'),
    zlib = require('zlib'),
    path = require('path'),

    _ = require('lodash'),
    inherit = require('inherit'),
    vow = require('vow'),
    vowNode = require('vow-node'),
    fsExtra = require('fs-extra'),
    tar = require('tar'),
    fstream = require('fstream'),
    Logger = require('bem-site-logger'),

    utility = require('./../util'),
    Pather = require('./../pather'),

    API;

module.exports = API = inherit({

    _options: undefined,
    _logger: undefined,
    _pather: undefined,

    __constructor: function (options) {
        this._options = options;

        this._logger = Logger.setOptions(options['logger']).createLogger(module);
        this._pather = Pather.create(options.path);
    },

    /**
     * Returns list of sorted snapshot folder names
     * @param {Function} callback function
     */
    getSnapshots: function (callback) {
        fs.readdir(this._pather.getSnapshotsDir(), function (error, snapshots) {
            error ? callback(error) : callback(null, snapshots.sort(utility.sortSnapshots));
        });
    },

    /**
     * Returns name of snapshot which given symlink is pointed to
     * @param {String} symlink - name of symlink (testing, production, e.t.c)
     * @param {Function} callback function
     */
    getSnapshotNameForSymlink: function (symlink, callback) {
        if (!symlink) {
            return callback(new Error('symlink name was not set'));
        }

        fs.realpath(this._pather.getSymlink(symlink), function (err, resolved) {
            err ? callback(err) : callback(null, resolved.split('/').pop());
        });
    },

    /**
     * Retrieves data of snapshot for given symlink name
     * @param {String} symlink name
     * @param {Stream} destination stream
     * @param {Function} callback function
     */
    getSnapshotDataForSymlink: function (symlink, destination, callback) {
        var onSuccess = function () {
                this._logger.info('Snapshot data for %s environment was sent successfully', symlink);
                callback(null);
            },
            onError = function (error) {
                this._logger.error('Error occur while loading data for %s environment', symlink);
                this._logger.error(error.message);
                callback(error);
            };

        fstream.Reader({ path: this._pather.getSymlink(symlink), type: 'Directory' })
            .pipe(tar.Pack())
            .pipe(zlib.Gzip())
            .pipe(destination)
            .on('error', onError.bind(this))
            .on('close', onSuccess.bind(this))
            .on('end', onSuccess.bind(this));
    },

    /**
     * Returns changes of snapshot by given snapshot name
     * @param {String} snapshot - name of snapshot
     * @param {Function} callback function
     */
    getSnapshotChanges: function (snapshot, callback) {
        if (!snapshot) {
            return callback(new Error('snapshot name was not set'));
        }

        var snapshotDataPath = this._pather.getSnapshotDataFile(snapshot);
        fsExtra.readJSONFile(snapshotDataPath, { encoding: 'utf-8' }, function (error, data) {
            error ? callback(error) : callback(null, data);
        });
    },

    /**
     * Switch symlink to folder with given snapshot name
     * @param {String} symlink - name of symlink
     * @param {String} snapshot - name of snapshot
     * @param {Function} callback function
     */
    switchSymlinkToSnapshot: function (symlink, snapshot, callback) {
        if (!symlink) {
            return callback(new Error('symlink name was not set'));
        }

        if (!snapshot) {
            return callback(new Error('snapshot name was not set'));
        }

        var symlinkPath = this._pather.getSymlink(symlink),
            snapshotPath = this._pather.getSnapshotDir(snapshot);

        fsExtra.remove(symlinkPath, function (error) {
            error ? callback(error) : fs.symlink(snapshotPath, symlinkPath, 'dir', function (error) {
                error ? callback(error) : callback(null);
            });
        });
    },

    /**
     * Removes snapshot by given snapshot name
     * @param {String} snapshot name
     * @param {Function} callback function
     */
    removeSnapshot: function (snapshot, callback) {
        if (!snapshot) {
            return callback(new Error('snapshot name was not set'));
        }

        vow.allResolved(_.chain(this._options.symlinks)
            .map(function (item) {
                return this._pather.getSymlink(item);
            }, this)
            .map(function (item) {
                return vowNode.promisify(fs.realpath)(item);
            })
            .value())
            .then(function (symlinks) {
                var isBusy = _.chain(symlinks)
                    .filter(function (item) { return item.isFulfilled(); })
                    .map(function (item) { return item.valueOf(); })
                    .map(function (item) { return path.basename(item); })
                    .some(function (item) { return item === snapshot; })
                    .value();

                if (isBusy) {
                    return callback(new Error('Snapshot can\'t be removed'));
                }

                fsExtra.remove(this._pather.getSnapshotDir(snapshot), function (error) {
                    error ? callback(error) : callback(null);
                });
            }, this).done();
    }
});
