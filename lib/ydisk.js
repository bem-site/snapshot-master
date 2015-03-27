var inherit = require('inherit'),
    YandexDisk = require('yandex-disk').YandexDisk;

module.exports = inherit({
    _namespace: undefined,
    _disk: undefined,

    /**
     * Constructor function
     * @param {Object} options for initializing Yandex Disk API wrapper
     * Available option fields:
     * {String} user - name of user
     * {String} password - user password
     * {String} namespace - disk namespace
     * @private
     */
    __constructor: function (options) {
        this._namespace = options.namespace;
        this._disk = new YandexDisk(options.user, options.password);
    },

    /**
     * Returns Yandex Disk API object
     * @returns {Object}
     */
    getDisk: function () {
        return this._disk;
    },

    /**
     * Returns configured namespace for snapshots on Yandex Disk
     * @returns {String}
     */
    getNamespace: function () {
        return this._namespace;
    }
});
