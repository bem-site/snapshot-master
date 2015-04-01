var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),

    vow = require('vow'),
    moment = require('moment'),
    fsExtra = require('fs-extra'),

    should = require('should'),
    utility = require('../../../lib/util'),
    API = require('../../../lib/api/simple');

describe('api-simple', function () {
    var options = {
            path: path.resolve(process.cwd(), './test/test-data'),
            symlinks: ['testing', 'production'],
            logger: {
                mode: 'testing'
            }
        };

    describe('initialization', function () {
        it('should be done', function () {
            var api = new API(options);

            api._options.should.be.ok;
            api._logger.should.be.ok;
            api._pather.should.be.ok;
        });
    });

    describe('getSnapshots', function () {
        var baseFolder = path.join(__dirname, '../../test-data'),
            snapshotsFolder = path.join(baseFolder, 'snapshots'),
            snapshotNames = [];

        before(function () {
            fsExtra.mkdirpSync(baseFolder);
            [3, 1, 4, 5, 2]
                .map(function (item) { return moment()['subtract'](item, 'days'); })
                .map(function (item) {
                    var sn = item.format('D:M:YYYY-H:m:s');
                    snapshotNames.push(sn);
                    return sn;
                })
                .map(function (item) { return path.join(snapshotsFolder, item); })
                .map(function (item) { return fsExtra.mkdirpSync(item); });
        });

        it ('should return valid result', function (done) {
            var api = new API(options);
            api.getSnapshots(function (err, result) {
                should(err).not.be.ok;
                result.should.be.ok;

                result.should.be.instanceOf(Array);
                result.should.have.length(5);
                should.deepEqual(result, snapshotNames.sort(utility.sortSnapshots));
                done();
            });
        });

        after(function () {
            fsExtra.removeSync(baseFolder)
        });
    });

    describe('getSnapshotNameForSymlink', function () {
        var baseFolder = path.join(__dirname, '../../test-data'),
            snapshotsFolder = path.join(baseFolder, 'snapshots'),
            snapshotNames = [];

        before(function () {
            fsExtra.mkdirpSync(baseFolder);
            [3, 1, 4, 5, 2]
                .map(function (item) { return moment()['subtract'](item, 'days'); })
                .map(function (item) {
                    var sn = item.format('D:M:YYYY-H:m:s');
                    snapshotNames.push(sn);
                    return sn;
                })
                .map(function (item) { return path.join(snapshotsFolder, item); })
                .map(function (item) { return fsExtra.mkdirpSync(item); });

            fs.symlinkSync(path.join(snapshotsFolder, snapshotNames[1]), path.join(baseFolder, 'testing'), 'dir');
            fs.symlinkSync(path.join(snapshotsFolder, snapshotNames[3]), path.join(baseFolder, 'production'), 'dir');
        });

        it ('error: empty symlink name', function (done) {
            var api = new API(options);
            api.getSnapshotNameForSymlink(null, function (err, result) {
                err.should.be.ok;
                err.message.should.equal('symlink name was not set');
                done();
            });
        });

        it ('error: invalid symlink name', function (done) {
            var api = new API(options);
            api.getSnapshotNameForSymlink('staging', function (err, result) {
                err.should.be.ok;
                done();
            });
        });

        it('should return valid result for testing', function (done) {
            var api = new API(options);
            api.getSnapshotNameForSymlink('testing', function (err, result) {
                should(err).not.be.ok;
                result.should.be.ok;

                result.should.be.instanceOf(String);
                result.should.be.equal(snapshotNames[1]);

                done();
            });
        });

        it('should return valid result for production', function (done) {
            var api = new API(options);
            api.getSnapshotNameForSymlink('production', function (err, result) {
                should(err).not.be.ok;
                result.should.be.ok;

                result.should.be.instanceOf(String);
                result.should.be.equal(snapshotNames[3]);

                done();
            });
        });

        after(function () {
            fsExtra.removeSync(baseFolder)
        });
    });

    describe('getSnapshotDataForSymlink', function () {
        var baseFolder = path.join(__dirname, '../../test-data'),
            snapshotsFolder = path.join(baseFolder, 'snapshots'),
            snapshotNames = [];

        before(function () {
            fsExtra.mkdirpSync(baseFolder);
            [3, 1, 4, 5, 2]
                .map(function (item) { return moment()['subtract'](item, 'days'); })
                .map(function (item) {
                    var sn = item.format('D:M:YYYY-H:m:s');
                    snapshotNames.push(sn);
                    return sn;
                })
                .map(function (item) { return path.join(snapshotsFolder, item); })
                .map(function (item) { return fsExtra.mkdirpSync(item); })
                .map(function (item) { return path.join(item, 'data.json'); })
                .map(function (item) { return fsExtra.writeJSON (item, { name: item })});

            fs.symlinkSync(path.join(snapshotsFolder, snapshotNames[1]), path.join(baseFolder, 'testing'), 'dir');
            fs.symlinkSync(path.join(snapshotsFolder, snapshotNames[3]), path.join(baseFolder, 'production'), 'dir');
        });

        it ('return valid result', function (done) {
            var api = new API(options),
                destination = fs.createWriteStream(path.join(baseFolder, 'archive.tar.gz'));
            api.getSnapshotDataForSymlink('testing', destination, function (err) {
                should(err).not.be.ok;
                fs.existsSync(path.join(baseFolder, 'archive.tar.gz')).should.equal(true);
                done();
            });
        });

        after(function () {
            fsExtra.removeSync(baseFolder)
        });
    });

    describe('getSnapshotChanges', function () {
        var baseFolder = path.join(__dirname, '../../test-data'),
            snapshotsFolder = path.join(baseFolder, 'snapshots'),
            snapshotNames = [];

        before(function () {
            fsExtra.mkdirpSync(baseFolder);
            [3, 1, 4, 5, 2]
                .map(function (item) { return moment()['subtract'](item, 'days'); })
                .map(function (item) {
                    var sn = item.format('D:M:YYYY-H:m:s');
                    snapshotNames.push(sn);
                    return sn;
                })
                .map(function (item) { return path.join(snapshotsFolder, item); })
                .map(function (item) {
                    fsExtra.mkdirpSync(item);
                    return item;
                })
                .map(function (item) { return path.join(item, 'data.json'); })
                .map(function (item) { return fsExtra.writeJSONSync (item, { name: item })});
        });

        it ('error: empty snapshot name', function (done) {
            var api = new API(options);
            api.getSnapshotChanges(null, function (err) {
                err.should.be.ok;
                err.message.should.equal('snapshot name was not set');
                done();
            });
        });

        it ('error: invalid snapshot name', function (done) {
            var api = new API(options);
            api.getSnapshotChanges('invalid', function (err) {
                err.should.be.ok;
                done();
            });
        });

        it ('return valid result', function (done) {
            var api = new API(options);
            api.getSnapshotChanges(snapshotNames[0], function (err, result) {
                should(err).not.be.ok;
                result.should.be.ok;

                result.should.be.instanceOf(Object);
                done();
            });
        });

        after(function () {
            fsExtra.removeSync(baseFolder)
        });
    });

    describe('switchSymlinkToSnapshot', function () {
        var baseFolder = path.join(__dirname, '../../test-data'),
            snapshotsFolder = path.join(baseFolder, 'snapshots'),
            snapshotNames = [];

        before(function () {
            fsExtra.mkdirpSync(baseFolder);
            [3, 1, 4, 5, 2]
                .map(function (item) { return moment()['subtract'](item, 'days'); })
                .map(function (item) {
                    var sn = item.format('D:M:YYYY-H:m:s');
                    snapshotNames.push(sn);
                    return sn;
                })
                .map(function (item) { return path.join(snapshotsFolder, item); })
                .map(function (item) { return fsExtra.mkdirpSync(item); });

            fs.symlinkSync(path.join(snapshotsFolder, snapshotNames[1]), path.join(baseFolder, 'testing'), 'dir');
            fs.symlinkSync(path.join(snapshotsFolder, snapshotNames[3]), path.join(baseFolder, 'production'), 'dir');
        });

        it ('error: empty symlink name', function (done) {
            var api = new API(options);
            api.switchSymlinkToSnapshot(null, snapshotNames[2], function (err) {
                err.should.be.ok;
                err.message.should.equal('symlink name was not set');
                done();
            });
        });

        it ('error: empty snapshot name', function (done) {
            var api = new API(options);
            api.switchSymlinkToSnapshot('testing', null, function (err) {
                err.should.be.ok;
                err.message.should.equal('snapshot name was not set');
                done();
            });
        });

        it ('should return valid result', function (done) {
            var api = new API(options);
            api.switchSymlinkToSnapshot('testing', snapshotNames[2], function (err) {
                should(err).not.be.ok;
                fs.realpathSync(path.join(baseFolder, 'testing')).indexOf(snapshotNames[2]).should.be.above(-1);
                done();
            });
        });

        after(function () {
            fsExtra.removeSync(baseFolder)
        });
    });

    describe('removeSnapshot', function () {
        var baseFolder = path.join(__dirname, '../../test-data'),
            snapshotsFolder = path.join(baseFolder, 'snapshots'),
            snapshotNames = [];

        before(function () {
            fsExtra.mkdirpSync(baseFolder);
            [3, 1, 4, 5, 2]
                .map(function (item) { return moment()['subtract'](item, 'days'); })
                .map(function (item) {
                    var sn = item.format('D:M:YYYY-H:m:s');
                    snapshotNames.push(sn);
                    return sn;
                })
                .map(function (item) { return path.join(snapshotsFolder, item); })
                .map(function (item) { return fsExtra.mkdirpSync(item); });

            fs.symlinkSync(path.join(snapshotsFolder, snapshotNames[1]), path.join(baseFolder, 'testing'), 'dir');
            fs.symlinkSync(path.join(snapshotsFolder, snapshotNames[3]), path.join(baseFolder, 'production'), 'dir');
        });

        it ('error: empty snapshot name', function (done) {
            var api = new API(options);
            api.removeSnapshot(null, function (err) {
                err.should.be.ok;
                err.message.should.equal('snapshot name was not set');
                done();
            });
        });

        it ('should not remove linked snapshots', function (done) {
            var api = new API(options);
            api.removeSnapshot(snapshotNames[1], function (err) {
                err.should.be.ok;
                err.message.should.equal('Snapshot can\'t be removed');
                fs.readdirSync(snapshotsFolder).should.have.length(5);
                done();
            });
        });

        it ('should return valid result', function (done) {
            var api = new API(options);
            api.removeSnapshot(snapshotNames[2], function (err) {
                should(err).not.be.ok;
                var snapshots = fs.readdirSync(snapshotsFolder);
                snapshots.should.have.length(4);
                snapshots.indexOf(snapshotNames[2]).should.equal(-1);
                done();
            });
        });

        after(function () {
            fsExtra.removeSync(baseFolder)
        });
    });
});
