var fs = require('fs'),
    path = require('path'),
    inherit = require('inherit'),
    fsExtra = require('fs-extra'),
    bseAdmin = require('bse-admin'),
    Tripwire = require('memory-tripwire'),
    logger = require('bem-site-logger').createLogger(module),
    SnapshotMaster = require('../lib/master/index'),

    DataBuilder = inherit(SnapshotMaster, {

        _bseConfig: undefined,

        loadConfig: function (callback) {
            var _this = this;
            this._logger.info('Load configuration file for bse-admin tool');
            fs.readFile('./config/_bse.json', { encoding: 'utf-8' }, function (error, config) {
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
            return this.__base()
                .then(function () { this['setIdle'](); }, this)
                .fail(function () { this['setIdle'](); }, this);
        }
    }),
    tripWireConfig = fsExtra.readJSONFileSync('./config/_tripwire.json'),
    appConfig = fsExtra.readJSONFileSync('./config/_config.json'),
    tripwire = new Tripwire(tripWireConfig),
    builder = new DataBuilder(appConfig);

tripwire.start();
tripwire.on('bomb', function () {
    logger.warn('||| ---  MEMORY LIMIT EXCEED. PROCESS WILL BE RESTARTED --- ||| ');
});
builder.loadConfig(function () {
    builder.start();
});
