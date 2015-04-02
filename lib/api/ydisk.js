var path = require('path'),
    inherit = require('inherit'),

    YDisk = require('../ydisk'),
    Simple = require('./simple'),
    API;

module.exports = API = inherit(Simple, {

    _ydisk: undefined,

    __constructor: function (options) {
        this.__base(options);
        this._ydisk = new YDisk(options['yandex-disk']);
    },

    /**
     * Switch symlink to folder with given snapshot name
     * @param {String} symlink - name of symlink
     * @param {String} snapshot - name of snapshot
     * @param {Function} callback function
     */
    switchSymlinkToSnapshot: function (symlink, snapshot, callback) {
        var _this = this,
            remotePath = path.join(this._ydisk.getNamespace(), symlink);
        this.__base(symlink, snapshot, function (error) {
            error ? callback (error) :
                _this._ydisk.getDisk()['writeFile'](remotePath, snapshot, 'utf-8', _this.cb(callback, null));
        });
    },

    /**
     * Removes snapshot by given snapshot name
     * @param {String} snapshot name
     * @param {Function} callback function
     */
    removeSnapshot: function (snapshot, callback) {
        var _this = this,
            remotePath = path.join(this._ydisk.getNamespace(), snapshot);
        this.__base(snapshot, function (error) {
            error ? callback (error) :
                _this._ydisk.getDisk()['remove'](remotePath, _this.cb(callback, null));
        });
    }
});
