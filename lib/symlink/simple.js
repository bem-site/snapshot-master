var fs = require('fs'),
    _ = require('lodash'),
    inherit = require('inherit'),
    vow = require('vow'),
    vowNode = require('vow-node'),
    fsExtra = require('fs-extra');

module.exports = inherit({
    execute: function (master, data) {
        var name = data.snapshotName,
            symlinks = _.chain(master.getOptions()['symlinks'])
                .map(function (item) {
                    return master.getPather().getSymlink(item);
                })
                .map(function (item) {
                    var srcPath = master.getPather().getSnapshotDir(name);
                    return vowNode.promisify(fsExtra.remove)(item)
                        .then(function () {
                            return vowNode.promisify(fs.symlink(srcPath, item, 'dir'));
                        });
                })
                .value();

            return vow.all(symlinks).then(function () { return data; });
    },

    getName: function () {
        return 'simple';
    }
});
