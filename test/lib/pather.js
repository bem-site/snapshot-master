var path = require('path'),
    Pather = require('../../lib/pather');

describe('pather', function () {
    var pather,
        snapshotName = '25:3:2015-15:52:46';

    before(function () {
        pather = new Pather(__dirname);
    });

    describe('API', function () {
        it('getSnapshotsDir', function () {
            pather.getSnapshotsDir().should.be.ok;
            pather.getSnapshotsDir().should.be.instanceOf(String);
            pather.getSnapshotsDir().should.equal(path.join(__dirname, 'snapshots'));
        });

        it('getSnapshotDir', function () {
            pather.getSnapshotsDir(snapshotName).should.be.ok;
            pather.getSnapshotsDir(snapshotName).should.be.instanceOf(String);
            pather.getSnapshotDir(snapshotName).should.equal(
                path.join(__dirname, 'snapshots', snapshotName));
        });

        it('getDbDir', function () {
            pather.getDbDir().should.be.ok;
            pather.getDbDir().should.be.instanceOf(String);
            pather.getDbDir().should.equal(path.join(__dirname, 'leveldb'));
        });

        it('getSnapshotDbDir', function () {
            pather.getSnapshotDbDir(snapshotName).should.be.ok;
            pather.getSnapshotDbDir(snapshotName).should.be.instanceOf(String);
            pather.getSnapshotDbDir(snapshotName).should.equal(
                path.join(__dirname, 'snapshots', snapshotName, 'leveldb'));
        });

        it('getSnapshotDataFile', function () {
            pather.getSnapshotDataFile(snapshotName).should.be.ok;
            pather.getSnapshotDataFile(snapshotName).should.be.instanceOf(String);
            pather.getSnapshotDataFile(snapshotName).should.equal(
                path.join(__dirname, 'snapshots', snapshotName, 'data.json'));
        });
    });
});
