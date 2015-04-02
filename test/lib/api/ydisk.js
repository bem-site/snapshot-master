var fs = require('fs'),
    path = require('path'),

    _ = require('lodash'),
    vow = require('vow'),
    moment = require('moment'),
    fsExtra = require('fs-extra'),

    should = require('should'),
    YDisk = require('../../../lib/ydisk'),
    API = require('../../../lib/api/ydisk'),
    yDisk;

describe('api-simple', function () {
    var options = {
        path: path.resolve(process.cwd(), './test/test-data'),
        symlinks: ['testing', 'production'],
        logger: {
            mode: 'testing'
        },
        'yandex-disk': {
            user: 'snapshot.master',
            password: '112233445566778899',
            namespace: 'test'
        }
    };

    before(function () {
        yDisk = new YDisk(options['yandex-disk']);
    });

    describe('initialization', function () {
        it('should be done', function () {
            var api = new API(options);

            api._options.should.be.ok;
            api._logger.should.be.ok;
            api._pather.should.be.ok;
            api._ydisk.should.be.ok;
        });
    });

    describe('switchSymlinkToSnapshot', function () {
        var baseFolder = path.join(__dirname, '../../test-data'),
            snapshotsFolder = path.join(baseFolder, 'snapshots'),
            snapshotNames = [];

        before(function (done) {
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
            yDisk.getDisk().mkdir(options['yandex-disk'].namespace, function () {
                done();
            });
        });

        it ('should return valid result', function (done) {
            var api = new API(options);
            api.switchSymlinkToSnapshot('testing', snapshotNames[2], function () {
                yDisk.getDisk().readFile(path.join(options['yandex-disk'].namespace, 'testing'), 'utf-8',
                    function (err, data) {
                        data.should.be.equal(snapshotNames[2]);
                        done();
                    });
            });
        });

        after(function (done) {
            fsExtra.removeSync(baseFolder);
            yDisk.getDisk().remove(options['yandex-disk'].namespace, function () {
                done();
            });
        });
    });

    describe('removeSnapshot', function () {
        var baseFolder = path.join(__dirname, '../../test-data'),
            snapshotsFolder = path.join(baseFolder, 'snapshots'),
            snapshotNames = [];

        before(function (done) {
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

            yDisk.getDisk().mkdir(options['yandex-disk'].namespace, function () {
                yDisk.getDisk().mkdir(path.join(options['yandex-disk'].namespace, snapshotNames[2]), function () {
                    done();
                })
            });
        });

        it ('should return valid result', function (done) {
            var api = new API(options);
            api.removeSnapshot(snapshotNames[2], function () {
                yDisk.getDisk().exists(path.join(options['yandex-disk'].namespace, snapshotNames[2]),
                    function (err, exists) {
                        exists.should.be.equal(false);
                        done();
                    });
            });
        });

        after(function (done) {
            fsExtra.removeSync(baseFolder);
            yDisk.getDisk().remove(options['yandex-disk'].namespace, function () {
                done();
            });
        });
    });
});
