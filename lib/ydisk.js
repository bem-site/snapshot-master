var inherit = require('inherit'),
    YandexDisk = require('yandex-disk').YandexDisk;

module.exports = inherit({
    _namespace: undefined,
    _disk: undefined,

    __constructor: function (options) {
        this._namespace = options.namespace;
        this._disk = new YandexDisk(options.user, options.password);
    },

    getDisk: function () {
        return this._disk;
    },

    getNamespace: function () {
        return this._namespace;
    }
});
