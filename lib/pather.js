var path = require('path'),
    inherit = require('inherit'),
    Pather;

module.exports = Pather = inherit({

    _basePath: undefined,

    __constructor: function (basePath) {
        this._basePath = basePath;
    },

    /**
     * Returns path to directory with database snapshots {base path}/snapshots
     * @returns {*|string}
     */
    getSnapshotsDir: function () {
        return path.join(this._basePath, this.__self.CONSTANTS.SNAPSHOTS);
    },

    /**
     * Returns path to given snapshot directory {base path}/snapshots/{snapshot name}
     * @param {String} snapshotName - name of snapshot
     * @returns {*|string}
     */
    getSnapshotDir: function (snapshotName) {
        return path.join(this.getSnapshotsDir(), snapshotName);
    },

    /**
     * Returns path to database folder {base path}/leveldb
     * @returns {*|string}
     */
    getDbDir: function () {
        return path.join(this._basePath, this.__self.CONSTANTS.DB);
    },

    /**
     * Returns path to database folder for given snapshot name
     * {base path}/snapshots/{snapshot name}/leveldb
     * @param {String} snapshotName - name of snapshot
     * @returns {*|string}
     */
    getSnapshotDbDir: function (snapshotName) {
        return path.join(this.getSnapshotDir(snapshotName), this.__self.CONSTANTS.DB);
    },

    /**
     * Returns path to data.json file for given snapshot
     * {base path}/snapshots/{snapshot name}/data.json
     * @param {String} snapshotName - name of snapshot
     * @returns {*|string}
     */
    getSnapshotDataFile: function (snapshotName) {
        return path.join(this.getSnapshotDir(snapshotName), this.__self.CONSTANTS.DATA_JSON);
    },

    /**
     * Returns path to symlink {base path}/{symlink name}
     * @param {String} symlinkName - name of symlink
     * @returns {*|string}
     */
    getSymlink: function (symlinkName) {
        return path.join(this._basePath, symlinkName);
    }
}, {
    CONSTANTS: {
        SNAPSHOTS: 'snapshots',
        DB: 'leveldb',
        DATA_JSON: 'data.json'
    },

    create: function (basePath) {
        return new Pather(basePath);
    }
});
