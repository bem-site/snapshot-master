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
});
