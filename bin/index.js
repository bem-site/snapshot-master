var fs = require('fs'),
    inherit = require('inherit'),
    SnapshotMaster = require('../lib/master/index'),
    bseAdmin = require('bse-admin'),
    logger = require('bem-site-logger').createLogger(module),

    DataBuilder = inherit(SnapshotMaster, {

        _bseConfig: undefined,

        loadConfig: function (callback) {
            var _this = this;
            this._logger.info('Load configuration file for bse-admin tool');
            fs.readFile('./configs/_bse.json', { encoding: 'utf-8' }, function (error, config) {
                if (error) {
                    _this.logger.error('Can\'t read configuration file for bse-admin tool');
                    throw error;
                }
                _this._bseConfig = JSON.parse(config);
                callback && callback();
            });
        },

        buildTarget: function () {
            return bseAdmin.syncNodes(this._bseConfig);
        },

        execute: function () {
            if (this['isActive']()) {
                this._logger.warn('Another execute process is being performed now');
                return;
            }
            this['setActive']();
            return this.__base.execute()
                .then(function () { this['setIdle'](); }, this)
                .fail(function () { this['setIdle'](); }, this);
        }
    });

fs.readFile('./configs/_config.json', { encoding: 'utf-8' }, function (error, config) {
    if (error) {
        logger.error('Can\'t read configuration file for snapshot-master tool');
        throw error;
    }
    var builder = new DataBuilder(JSON.parse(config));
    builder.loadConfig(function () {
        builder.start();
    });
});
