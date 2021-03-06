var util = require('util'),
    _ = require('lodash'),
    vow = require('vow'),
    inherit = require('inherit'),
    trtd = require('trtd'),

    Sender = require('bem-site-mail-sender'),
    Logger = require('bem-site-logger');

module.exports = inherit({

    _options: undefined,
    _sender: undefined,
    _logger: undefined,

    __constructor: function (options) {
        this._options = options;
        this._logger = Logger.setOptions(options['logger']).createLogger(module);
        this._sender = Sender.create(_.pick(options['e-mail'], ['host', 'port']));
    },

    /**
     * Group libraries changes bu library name
     * @param {Array} arr - array of changes
     * @returns {Array}
     * @private
     */
    _groupLibraryChanges: function (arr) {
        var o = arr.reduce(function (prev, item) {
            prev[item['lib']] = prev[item['lib']] || [];
            prev[item['lib']].push(item.version);
            return prev;
        }, {});

        if (!Object.keys(o).length) {
            return null;
        }

        return Object.keys(o).map(function (key) {
            return { lib: key, versions: o[key].join(', ') };
        });
    },

    /**
     * Join html tables of changes into single html structure
     * @param {String} added - added changes html table
     * @param {String} modified - modified changes html table
     * @param {String} removed - removed changes html table
     * @param {String} title - common title
     * @returns {String}
     * @private
     */
    _joinChanges: function (added, modified, removed, title) {
        var result = '<h1>' + title + '</h1>';

        if (!added && !modified && !removed) {
            return result + '<br/>Nothing has been changed';
        }

        // check if any docs were added, modified or removed
        added && (result += '<br/><h2>Added</h2><br/>' + added);
        modified && (result += '<br/><h2>Modified</h2><br/>' + modified);
        removed && (result += '<br/><h2>Removed</h2><br/>' + removed);
        return result;
    },

    /**
     * Creates html table for all documentation changes
     * @param {Object} changes object
     * @returns {*|Function}
     * @private
     */
    _createDocChangesTable: function (changes) {
        var docs = changes['_docs'],
            docTable = _.chain(this.__self.CHANGES_FIELDS)
                .map(function (key) {
                    if (!docs[key].length) {
                        return null;
                    }

                    return docs[key].map(function (item) {
                        item.title = item.title || '';
                        return item;
                    });
                })
                .map(function (item) {
                    return item ? trtd(['title', 'url'], item) : null;
                })
                .value();
        return vow.all(docTable).spread(function (added, modified, removed) {
                return this._joinChanges(added, modified, removed, 'Docs');
            }, this);
    },

    /**
     * Creates html table for all library changes
     * @param {Object} changes object
     * @returns {*|Function}
     * @private
     */
    _createLibraryChangesTable: function (changes) {
        var libraries = changes['_libraries' ],
            libTable = _.chain(this.__self.CHANGES_FIELDS)
                .map(function (key) {
                    return this._groupLibraryChanges(libraries[key]);
                }, this)
                .map(function (item) {
                    return item ? trtd(['lib', 'versions'], item) : null;
                })
                .value();

        return vow.all(libTable).spread(function (added, modified, removed) {
                return this._joinChanges(added, modified, removed, 'Libraries');
            }, this);
    },

    execute: function (data) {
        this._logger.info('_sendChanges: %s', data.snapshotName);

        var name = data.snapshotName,
            changes = data.buildResult.getChanges(),
            subject = util.format('%s: create new data version %s', this._options.name, name);

        return vow
            .all([
                this._createDocChangesTable(changes),
                this._createLibraryChangesTable(changes)
            ])
            .spread(function (docs, libraries) {
                var def = vow.defer(),
                    o = this._options['e-mail'];
                this._sender.sendHtml(o['from'], o['to'], subject, docs + libraries, function (err) {
                    err ? def.reject(err) : def.resolve();
                });
                return def.promise();
            }, this);
    }
}, {
    CHANGES_FIELDS: ['_added', '_modified', '_removed']
});
