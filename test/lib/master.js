var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),

    vow = require('vow'),
    fsExtra = require('fs-extra'),

    should = require('should'),
    utility = require('../../lib/util'),
    YDisk = require('../../lib/ydisk'),
    SnapshotMaster = require('../../lib/master/index.js');

describe('snapshot-master', function () {
    var options = {
            name: 'send-changes',
            path: path.resolve(process.cwd(), './test/test-data'),
            symlinks: ['staging', 'testing'],
            logger: {
                mode: 'testing'
            },
            'yandex-disk': {
                user: 'snapshot.master',
                password: '112233445566778899',
                namespace: 'test'
            },
            cron: {
                pattern: '0 */1 * * * *',
                debug: true
            },
            'e-mail': {
                host: 'stub',
                port: 25,
                from: 'from@snapshot-master.yandex.net',
                to: ['to@snapshot-master.yandex.net']
            }
        },
        yDisk;

    before(function () {
        yDisk = new YDisk(options['yandex-disk']);
    });

    describe('initialization', function () {
        it ('should fail if path option was not set', function () {
            var o = _.omit(options, 'path');
            (function () { return new SnapshotMaster(o); })
                .should.throw('Absolute path to snapshots directory was not set');
        });

        it ('should use default symlinks option', function () {
            var o = _.omit(options, 'symlinks'),
                sm = new SnapshotMaster(o);

            sm.should.be.ok;
            sm._options.symlinks.should.be.ok;
            should.deepEqual(sm._options.symlinks, ['testing']);
        });

        describe('without yandex-disk options', function () {
            it ('should use simple send', function () {
                var o = _.omit(options, 'yandex-disk'),
                    sm = new SnapshotMaster(o);
                sm._sendTask.getName().should.equal('simple');
            });

            it ('should use simple symlink', function () {
                var o = _.omit(options, 'yandex-disk'),
                    sm = new SnapshotMaster(o);

                sm._symlinkTask.getName().should.equal('simple');
            });
        });

        describe('with yandex-disk options', function () {
            it ('should use ydisk send', function () {
                var sm = new SnapshotMaster(options);
                sm._sendTask.getName().should.equal('ydisk');
            });

            it ('should use ydisk symlink', function () {
                var sm = new SnapshotMaster(options);
                sm._symlinkTask.getName().should.equal('ydisk');
            });
        });

        describe('without e-mail options', function () {
            it('should set stub instead of setChanges task', function () {
                var o = _.omit(options, 'e-mail'),
                    sm = new SnapshotMaster(o);

                sm._sendChangesTask.should.be.ok;
                sm._sendChangesTask.should.have.property('execute');
                sm._sendChangesTask.execute.should.be.instanceOf(Function);
                should.deepEqual(sm._sendChangesTask.execute(), vow.resolve());
            });
        });

        it('should be successfully initialized with given options', function () {
            var sm = new SnapshotMaster(options);
            sm.should.be.ok;

            sm._options.path.should.be.ok;
            sm._options.symlinks.should.be.ok;
            sm._options['yandex-disk'].should.be.ok;

            sm._options.path.should.equal(path.resolve(process.cwd(), './test/test-data'));
            should.deepEqual(sm._options.symlinks, ['staging', 'testing']);
        });
    });

    describe('_createSnapshot', function () {
        var sm,
            baseFolder = path.join(__dirname, '../test-data'),
            levelDbFolder = path.join(baseFolder, 'leveldb'),
            name = utility.buildSnapshotName(),
            buildResult = { getChanges: function () { return 'test changes json structure'; } },
            data = { buildResult: buildResult, snapshotName: name };

        before(function () {
            fsExtra.mkdirpSync(baseFolder);
            fsExtra.mkdirpSync(levelDbFolder);
            [1, 2, 3, 4, 5].forEach(function (item) {
                fsExtra.writeJSONSync(path.join(levelDbFolder, item + '.json'), { file: item });
            });

            sm = new SnapshotMaster(options);
        });

        it ('should be done', function (done) {
            return sm._createSnapshot(data).then(function () {
                done();
            });
        });

        it ('should exists snapshots folder', function () {
            fs.existsSync(path.join(baseFolder, 'snapshots')).should.equal(true);
        });

        it ('should exists snapshot folder', function () {
            fs.existsSync(path.join(baseFolder, 'snapshots', name)).should.equal(true);
        });

        it ('should exists data.json snapshot file', function () {
            fs.existsSync(path.join(baseFolder, 'snapshots', name, 'data.json')).should.equal(true);
        });

        it ('should exists leveldb snapshot folder', function () {
            fs.existsSync(path.join(baseFolder, 'snapshots', name, 'leveldb')).should.equal(true);
        });

        it ('should have valid data.json file', function () {
            var content = fsExtra.readJsonSync(path.join(baseFolder, 'snapshots', name, 'data.json'));
            content.should.be.ok;
            content.should.have.property('date');
            content.should.have.property('changes');

            content.date.should.equal(name);
        });

        after(function () {
            fsExtra.removeSync(path.join(__dirname, '../test-data'));
        });
    });

    describe('_sendSnapshot', function () {
        var sm,
            baseFolder = path.join(__dirname, '../test-data'),
            levelDbFolder = path.join(baseFolder, 'leveldb'),
            name = utility.buildSnapshotName(),
            buildResult = { getChanges: function () { return 'test changes json structure'; } },
            data = { buildResult: buildResult, snapshotName: name };

        before(function (done) {
            fsExtra.mkdirpSync(baseFolder);
            fsExtra.mkdirpSync(levelDbFolder);
            [1, 2, 3, 4, 5].forEach(function (item) {
                fsExtra.writeJSONSync(path.join(levelDbFolder, item + '.json'), { file: item });
            });

            sm = new SnapshotMaster(options);
            return sm._createSnapshot(data).then(function () {
                yDisk.getDisk().mkdir(options['yandex-disk'].namespace, function (err) {
                    done();
                });
            });
        });

        it ('should be done', function (done) {
            sm._sendTask.execute(data).then(function () {
                done();
            });
        });

        it ('should exists db archive', function () {
            fs.existsSync(path.join(baseFolder, 'snapshots', name, 'leveldb.tar.gz')).should.equal(true);
        });

        it ('should not exists db folder', function () {
            fs.existsSync(path.join(baseFolder, 'snapshots', name, 'leveldb')).should.equal(false);
        });

        it ('should exists snapshot folder on Yandex Disk', function (done) {
            yDisk.getDisk().exists(path.join(options['yandex-disk'].namespace, name), function (err, exists) {
                exists.should.be.equal(true);
                done();
            });
        });

        it ('should exists snapshot db archive on Yandex Disk', function (done) {
            yDisk.getDisk().exists(path.join(options['yandex-disk'].namespace, name, 'leveldb.tar.gz'),
                function (err, exists) {
                    exists.should.be.equal(true);
                    done();
                });
        });

        it ('should exists snapshot data.json file on Yandex Disk', function (done) {
            yDisk.getDisk().exists(path.join(options['yandex-disk'].namespace, name, 'data.json'),
                function (err, exists) {
                    exists.should.be.equal(true);
                    done();
                });
        });

        after(function (done) {
            fsExtra.removeSync(path.join(__dirname, '../test-data'));
            done();
            /*
            yDisk.getDisk().remove(options['yandex-disk'].namespace, function (err) {
               done();
            });
            */
        });
    });

    describe('_setSymlink', function () {
        var sm,
            baseFolder = path.join(__dirname, '../test-data'),
            levelDbFolder = path.join(baseFolder, 'leveldb'),
            name = utility.buildSnapshotName(),
            buildResult = { getChanges: function () { return 'test changes json structure'; } },
            data = { buildResult: buildResult, snapshotName: name };

        describe('simple', function () {
            before(function (done) {
                fsExtra.mkdirpSync(baseFolder);
                fsExtra.mkdirpSync(levelDbFolder);
                [1, 2, 3, 4, 5].forEach(function (item) {
                    fsExtra.writeJSONSync(path.join(levelDbFolder, item + '.json'), { file: item });
                });

                var o = _.omit(options, 'yandex-disk');
                sm = new SnapshotMaster(o);
                return sm._createSnapshot(data)
                    .then(function () {
                        return sm._sendTask.execute(data)
                    })
                    .then(function () {
                        done();
                    });
            });

            it ('should be done', function (done) {
                sm._symlinkTask.execute(data).then(function () {
                    done();
                });
            });

            it ('should exists testing symlink', function () {
                fs.existsSync(path.join(baseFolder, 'testing')).should.equal(true);
            });

            it ('should be valid real path of testing symlink', function () {
                fs.realpathSync(path.join(baseFolder, 'testing')).should.equal(
                    path.join(baseFolder, 'snapshots', name));
            });

            it ('should exists staging symlink', function () {
                fs.existsSync(path.join(baseFolder, 'staging')).should.equal(true);
            });

            it ('should be valid real path of staging symlink', function () {
                fs.realpathSync(path.join(baseFolder, 'staging')).should.equal(
                    path.join(baseFolder, 'snapshots', name));
            });

            after(function () {
                fsExtra.removeSync(path.join(__dirname, '../test-data'));
            });
        });

        describe('ydisk', function () {
            before(function (done) {
                fsExtra.mkdirpSync(baseFolder);
                fsExtra.mkdirpSync(levelDbFolder);
                [1, 2, 3, 4, 5].forEach(function (item) {
                    fsExtra.writeJSONSync(path.join(levelDbFolder, item + '.json'), { file: item });
                });

                sm = new SnapshotMaster(options);
                return sm._createSnapshot(data)
                    .then(function () {
                        return sm._sendTask.execute(data)
                    })
                    .then(function () {
                        done();
                    })
                    .fail(function (err) {
                        console.err(err);
                    });
            });

            it ('should be done', function (done) {
                sm._symlinkTask.execute(data).then(function () {
                    done();
                });
            });

            it ('should exists testing symlink', function (done) {
                yDisk.getDisk().exists(path.join(options['yandex-disk'].namespace, 'testing'), function (err, exists) {
                    exists.should.be.equal(true);
                    done();
                });
            });

            it ('should be valid name of snapshot in testing file', function (done) {
                yDisk.getDisk().readFile(path.join(options['yandex-disk'].namespace, 'testing'), 'utf-8',
                    function (err, data) {
                        data.should.be.equal(name);
                        done();
                    });
            });

            it ('should exists staging symlink', function (done) {
                yDisk.getDisk().exists(path.join(options['yandex-disk'].namespace, 'staging'), function (err, exists) {
                    exists.should.be.equal(true);
                    done();
                });
            });

            it ('should be valid name of snapshot in staging file', function (done) {
                yDisk.getDisk().readFile(path.join(options['yandex-disk'].namespace, 'staging'), 'utf-8',
                    function (err, data) {
                        data.should.be.equal(name);
                        done();
                    });
            });

            after(function () {
                fsExtra.removeSync(path.join(__dirname, '../test-data'));
                /*
                yDisk.getDisk().remove(options['yandex-disk'].namespace, function (err) {
                    done();
                });
                */
            });
        });
    });

    describe('buildTarget', function () {
        it('should be valid buildTarget', function (done) {
            var sm = new SnapshotMaster(options);
            sm.buildTarget().then(function (result) {
                result.should.be.ok;
                result.should.have.property('getChanges');

                result.getChanges.should.be.instanceOf(Function);
                result.getChanges().should.be.ok;
                result.getChanges().should.have.property('areModified');
                result.getChanges().areModified().should.equal(true);
                done();
            });
        });
    });

    describe('execute without changes', function () {
        var sm;

        before(function () {
            sm = new SnapshotMaster(options);
            sm.buildTarget = function () {
                return vow.resolve({
                    getChanges: function () {
                        return {
                            areModified: function () {
                                return false;
                            }
                        };
                    }
                });
            };
        });

        it('should be done', function (done) {
            sm.execute().then(function (result) {
                result.should.equal(false);
                done();
            });
        });
    });

    describe('execute', function () {
        var sm,
            baseFolder = path.join(__dirname, '../test-data'),
            levelDbFolder = path.join(baseFolder, 'leveldb');

        before(function () {
            fsExtra.mkdirpSync(baseFolder);
            fsExtra.mkdirpSync(levelDbFolder);
            [1, 2, 3, 4, 5].forEach(function (item) {
                fsExtra.writeJSONSync(path.join(levelDbFolder, item + '.json'), { file: item });
            });

            sm = new SnapshotMaster(options);
            sm.buildTarget = function () {
                return vow.resolve({
                    getChanges: function () {
                        return {
                            areModified: function () {
                                return true;
                            },
                            _docs: {
                                _added: [
                                    { title: 'title1', url: 'http://test.url1' },
                                    { title: null, url: 'http://test.url2' }
                                ],
                                _modified: [
                                    { title: 'title3', url: 'http://test.url3' },
                                    { title: 'title4', url: 'http://test.url4' }
                                ],
                                _removed: []
                            },
                            _libraries: {
                                _added: [
                                    { lib: 'bem-core', version: 'v2.6.0' },
                                    { lib: 'bem-components', version: 'v2.1.0' }
                                ],
                                _modified: [
                                    { lib: 'bem-components', version: 'v2.0.0' },
                                    { lib: 'bem-core', version: 'v2.5.0' }
                                ],
                                _removed: [
                                    { lib: 'bem-core', version: 'v2.3.0' }
                                ]
                            }
                        };
                    }
                });
            };
        });

        it('should be done', function (done) {
            sm.execute().then(function (result) {
                result.should.equal(true);
                done();
            });
        });

        after(function (done) {
            fsExtra.removeSync(path.join(__dirname, '../test-data'));
            yDisk.getDisk().remove(options['yandex-disk'].namespace, function (err) {
                done();
            });
        });
    });
});
