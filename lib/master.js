var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    inherit = require('inherit'),

    vow = require('vow'),
    vowNode = require('vow-node'),
    fsExtra = require('fs-extra'),
    moment = require('moment'),
    CronRunner = require('cron-runner'),

    SendSimple = require('./send/simple'),
    SendDisk = require('./send/ydisk'),
    SymlinkSimple = require('./symlink/simple'),
    SymlinkDisk = require('./symlink/ydisk');

module.exports = inherit(CronRunner, {

    _sendTask: undefined,
    _symlinkTask: undefined,

    __constructor: function (options) {
        this.__base(options);

        var o = this._options;
        if (!o.path) {
            throw new Error('Absolute path to snapshots directory was not set');
        }

        if (!o.symlinks) {
            console.warn('Existed "symlinks" option was not set. Default "symlinks" options will be set');
            this._options.symlinks = this.__self.DEFAULT.SYMLINKS;
        }

        if (!o['yandex-disk']) {
            console.warn('Yandex Disk options were not set. Snapshots will not be sent to Yandex Disk');
            this._sendTask = SendSimple;
            this._symlinkTask = SymlinkSimple;
        } else {
            this._sendTask = SendDisk;
            this._symlinkTask = SymlinkDisk;
        }
    },

    buildTarget: function () {
        // TODO implement something here
    },

    execute: function () {
        return this.buildTarget()
            .then(function (buildResult) {

            });
    },

}, {
    DATE_FORMAT: 'D:M:YYYY-H:m:s', // snapshot name date format
    DEFAULT: {
        SYMLINKS: ['testing'] // default set of environment symlinks
    }
});
