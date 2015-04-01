var format = require('util').format,
    should = require('should'),
    util = require('../../lib/util');

describe('util', function () {
    describe('buildSnapshotName', function () {
        it('should create snapshot name', function () {
            util.buildSnapshotName().should.be.ok;
        });

        it('should create snapshot name as string', function () {
            util.buildSnapshotName().should.be.instanceOf(String);
        });

        it('should create snapshot name in valid format', function () {
            var snapshotName = util.buildSnapshotName();
            /(\d{1,2}):(\d{1,2}):(\d{1,4})-(\d{1,2}):(\d{1,2}):(\d{1,2})/.test(snapshotName).should.be.true;
        });

        it ('should be valid to deprecated way', function () {
            var deprecated = function () {
                var date = new Date();
                return format('%s:%s:%s-%s:%s:%s',
                    date.getDate(),
                    date.getMonth() + 1,
                    date.getFullYear(),
                    date.getHours(),
                    date.getMinutes(),
                    date.getSeconds()
                );
            };
            util.buildSnapshotName().should.be.equal(deprecated());
        });
    });

    describe('sortSnapshots', function () {
        it('should be ok', function () {
            util.sortSnapshots('1:4:2015-12:29:14', '29:3:2015-1:39:17').should.be.ok;
        });

        it('should be number', function () {
            util.sortSnapshots('1:4:2015-12:29:14', '29:3:2015-1:39:17').should.be.instanceOf(Number);
        });

        it('should be greater then 0', function () {
            util.sortSnapshots('1:4:2015-12:29:14', '29:3:2015-1:39:17').should.be.above(0);
        });

        it('should be less then 0', function () {
            util.sortSnapshots('29:3:2015-1:39:17', '1:4:2015-12:29:14').should.be.below(0);
        });
    });
});
