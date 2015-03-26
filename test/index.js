var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),

    fsExtra = require('fs-extra'),
    moment = require('moment'),

    should = require('should'),
    SnapshotCleaner = require('../lib/master.js');

describe('snapshot-master', function () {
    var options = {
        path: path.resolve(process.cwd(), './test/test-data'),
        symlinks: ['staging', 'testing'],
        'yandex-disk': {
            user: 'snapshot.master',
            password: '112233445566778899',
            namespace: 'test'
        },
        cron: {
            pattern: '0 */1 * * * *',
            debug: true
        }
    };

    before(function () {});

    describe('initialization', function () {
        it ('should fail if path option was not set', function () {
            var o = _.omit(options, 'path');
            (function () { return new SnapshotCleaner(o); })
                .should.throw('Absolute path to snapshots directory was not set');
        });

        it ('should use default symlinks option', function () {
            var o = _.omit(options, 'symlinks'),
                sc = new SnapshotCleaner(o);

            sc.should.be.ok;
            sc._options.symlinks.should.be.ok;
            should.deepEqual(sc._options.symlinks, ['testing']);
        });

        describe('without yandex-disk options', function () {
            it ('should use simple send', function () {
                var o = _.omit(options, 'yandex-disk'),
                    sc = new SnapshotCleaner(o);

                sc._sendTask.getName().should.equal('simple');
            });

            it ('should use simple symlink', function () {
                var o = _.omit(options, 'yandex-disk'),
                    sc = new SnapshotCleaner(o);

                sc._symlinkTask.getName().should.equal('simple');
            });
        });

        describe('with yandex-disk options', function () {
            it ('should use ydisk send', function () {
                var sc = new SnapshotCleaner(options);
                sc._sendTask.getName().should.equal('ydisk');
            });

            it ('should use ydisk symlink', function () {
                var sc = new SnapshotCleaner(options);
                sc._symlinkTask.getName().should.equal('ydisk');
            });
        });

        it('should be successfully initialized with given options', function () {
            var sc = new SnapshotCleaner(options);
            sc.should.be.ok;

            sc._options.path.should.be.ok;
            sc._options.symlinks.should.be.ok;
            sc._options['yandex-disk'].should.be.ok;

            sc._options.path.should.equal(path.resolve(process.cwd(), './test/test-data'));
            should.deepEqual(sc._options.symlinks, ['staging', 'testing']);
        });
    });

    describe('execute', function () {
        before(function () {});

        after(function () {
            fsExtra.removeSync(path.join(__dirname, 'test-data'));
        });
    });
});
