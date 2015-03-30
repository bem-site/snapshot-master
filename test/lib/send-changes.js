var should = require('should'),
    SendChanges = require('../../lib/send-changes');

describe('send-changes', function () {
    var options = {
        logger: {
            level: 'debug'
        }
    };

    describe('_groupLibraryChanges', function () {
        var sendChanges = new SendChanges(options);

        it('should return null on empty array', function () {
            should(sendChanges._groupLibraryChanges([])).be.equal(null);
        });

        it ('should return grouped library changes', function () {
            var input = [
                    { lib: 'bem-core', version: 'v2.3.0' },
                    { lib: 'bem-core', version: 'v2.5.0' },
                    { lib: 'bem-core', version: 'v2.6.0' },
                    { lib: 'bem-components', version: 'v2.0.0' },
                    { lib: 'bem-components', version: 'v2.1.0' },
                ],
                output = [
                    { lib: 'bem-core', versions: 'v2.3.0, v2.5.0, v2.6.0' },
                    { lib: 'bem-components', versions: 'v2.0.0, v2.1.0' }
                ];
            should.deepEqual(sendChanges._groupLibraryChanges(input), output);
        });
    });

    describe('_joinChanges', function () {
        var sendChanges = new SendChanges(options);

        it('without added modified and removed', function () {
            var jc = sendChanges._joinChanges(null, null, null, 'test title');

            jc.should.be.ok;
            jc.should.be.instanceOf(String);
            jc.should.equal('<h1>test title</h1><br/>Nothing has been changed');
        });

        it('without added', function () {
            var jc = sendChanges._joinChanges(null, 'test modified', 'test removed', 'test title');

            jc.should.be.ok;
            jc.should.be.instanceOf(String);
            jc.should.equal('<h1>test title</h1>' +
            '<br/><h2>Modified</h2><br/>test modified' +
            '<br/><h2>Removed</h2><br/>test removed');
        });

        it('without modified', function () {
            var jc = sendChanges._joinChanges('test added', null, 'test removed', 'test title');

            jc.should.be.ok;
            jc.should.be.instanceOf(String);
            jc.should.equal('<h1>test title</h1>' +
            '<br/><h2>Added</h2><br/>test added' +
            '<br/><h2>Removed</h2><br/>test removed');
        });

        it('without removed', function () {
            var jc = sendChanges._joinChanges('test added', 'test modified', null, 'test title');

            jc.should.be.ok;
            jc.should.be.instanceOf(String);
            jc.should.equal('<h1>test title</h1>' +
            '<br/><h2>Added</h2><br/>test added' +
            '<br/><h2>Modified</h2><br/>test modified');
        });

        it('with added modified and removed', function () {
            var jc = sendChanges._joinChanges('test added', 'test modified', 'test removed', 'test title');

            jc.should.be.ok;
            jc.should.be.instanceOf(String);
            jc.should.equal('<h1>test title</h1>' +
            '<br/><h2>Added</h2><br/>test added' +
            '<br/><h2>Modified</h2><br/>test modified' +
            '<br/><h2>Removed</h2><br/>test removed');
        });
    });

    describe('_createDocChangesTable', function (done) {
        var sendChanges = new SendChanges(options),
            input = {
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
                }
            };

        it('should be done', function (done) {
            sendChanges._createDocChangesTable(input).then(function (data) {
                data.should.be.ok;
                data.should.be.instanceOf(String);
                done();
            });
        });
    });

    describe('_createLibraryChangesTable', function (done) {
        var sendChanges = new SendChanges(options),
            input = {
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

        it('should be done', function (done) {
            sendChanges._createLibraryChangesTable(input).then(function (data) {
                data.should.be.ok;
                data.should.be.instanceOf(String);
                done();
            });
        });
    });
});
