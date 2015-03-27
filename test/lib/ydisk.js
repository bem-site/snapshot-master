var should = require('should'),
    YDisk = require('../../lib/ydisk');

describe('ydisk', function () {
    var options = {
            user: 'test user',
            password: 'test password',
            namespace: 'test namespace'
        },
        yDisk;

    it('should be initialized successfully', function () {
        yDisk = new YDisk(options);
        yDisk.should.be.ok;

        yDisk._disk.should.be.ok;
        yDisk._disk.should.be.instanceOf(Object);

        yDisk._namespace.should.be.ok;
        yDisk._namespace.should.be.instanceOf(String);
        yDisk._namespace.should.equal('test namespace');
    });

    it('should return valid disk object', function () {
        yDisk.getDisk().should.be.ok;
        yDisk.getDisk().should.be.instanceOf(Object);
    });

    it('should return valid namespace', function () {
        yDisk.getNamespace().should.be.ok;
        yDisk.getNamespace().should.be.instanceOf(String);
        yDisk.getNamespace().should.equal('test namespace');
    });
});
