var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    inherit = require('inherit'),

    vow = require('vow'),
    vowNode = require('vow-node'),
    fsExtra = require('fs-extra'),
    moment = require('moment'),
    CronRunner = require('cron-runner'),

    utility = require('./util'),
    Pather = require('./pather'),
    SendSimple = require('./send/simple'),
    SendDisk = require('./send/ydisk'),
    SymlinkSimple = require('./symlink/simple'),
    SymlinkDisk = require('./symlink/ydisk');

module.exports = inherit(CronRunner, {

    _pather: undefined,
    _sendTask: undefined,
    _symlinkTask: undefined,

    __constructor: function (options) {
        this.__base(options);

        var o = this._options;
        if (!o.path) {
            throw new Error('Absolute path to snapshots directory was not set');
        }

        this._pather = new Pather(o.path);

        if (!o.symlinks) {
            console.warn('Existed "symlinks" option was not set. Default "symlinks" options will be set');
            this._options.symlinks = this.__self.DEFAULT.SYMLINKS;
        }

        if (!o['yandex-disk']) {
            console.warn('Yandex Disk options were not set. Snapshots will not be sent to Yandex Disk');
            this._sendTask = new SendSimple();
            this._symlinkTask = new SymlinkSimple();
        } else {
            this._sendTask = new SendDisk();
            this._symlinkTask = new SymlinkDisk();
        }
    },

    buildTarget: function () {
        return {
            getChanges: function () {
                return {
                    areModified: function () {
                        return true;
                    }
                };
            }
        };
    },

    execute: function () {
        return this.buildTarget()
            .then(function (buildResult) {
                if (!buildResult.getChanges().areModified()) {
                    return;
                }
                var name = utility.buildSnapshotName();
                return vow.resolve({ buildResult: buildResult, snapshotName: name })
                    .then(this._createSnapshot.bind(this))
                    .then(this._sendSnapshot.bind(this))
                    .then(this._setSymlink.bind(this));
            }, this);
    },

    _createSnapshot: function (data) {
        var buildResult = data.buildResult,
            name = data.snapshotName,
            meta = { date: name, changes: buildResult.getChanges() };

        return vowNode.promisify(fsExtra.mkdirs)(this._pather.getSnapshotDir(name))
            .then(function () {
                var srcPath = this._pather.getDbDir(),
                    dstPath = this._pather.getSnapshotDbDir(name),
                    dataPath = this._pather.getSnapshotDataFile(name),
                    copyBase = vowNode.promisify(fsExtra.copy)(srcPath, dstPath),
                    writeData = vowNode.promisify(fsExtra.writeJSON)(dataPath, meta);

                return vow.all([copyBase, writeData]);
            }, this)
            .then(function () {
                return data;
            });
    },

    _sendSnapshot: function (data) {
        return this._sendTask.execute(this, data);
    },

    _setSymlink: function (data) {
        return this._symlinkTask.execute(this, data);
    }
}, {
    DATE_FORMAT: 'D:M:YYYY-H:m:s', // snapshot name date format
    DEFAULT: {
        SYMLINKS: ['testing'] // default set of environment symlinks
    }
});
