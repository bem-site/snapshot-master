var fs = require('fs'),
    zlib = require('zlib'),
    vow = require('vow'),
    vowNode = require('vow-node'),
    inherit = require('inherit'),
    tar = require('tar'),
    fstream = require('fstream'),
    fsExtra = require('fs-extra');

module.exports = inherit({
    execute: function (master, data) {
        return vow.resolve(data)
            .then(this._createDbArchive.bind(master))
            .then(this._removeDbFolder.bind(master));
    },

    getName: function () {
        return 'simple';
    },

    _createDbArchive: function (data) {
        var def = vow.defer(),
            dbDir = this.getPather().getSnapshotDbDir(data.snapshotName);

        fstream.Reader({ path: dbDir, type: 'Directory' })
            .pipe(tar.Pack())
            .pipe(zlib.Gzip())
            .pipe(fs.createWriteStream(dbDir + '.tar.gz'))
            .on('error', function (err) {
                def.reject(err);
            })
            .on('close', function () {
                def.resolve(data);
            })
            .on('end', function () {
                def.resolve(data);
            });
        return def.promise();
    },

    _removeDbFolder: function (data) {
        var dbDir = this.getPather().getSnapshotDbDir(data.snapshotName);
        return vowNode.promisify(fsExtra.remove)(dbDir).then(function () {
            return data;
        });
    }
});
