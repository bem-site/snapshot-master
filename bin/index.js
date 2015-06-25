var fs = require('fs'),
    inherit = require('inherit'),
    fsExtra = require('fs-extra'),
    bseAdmin = require('bse-admin'),
    Tripwire = require('memory-tripwire'),
    logger = require('bem-site-logger').createLogger(module),
    SnapshotMaster = require('../lib/master/index'),

    DataBuilder = inherit(SnapshotMaster, {

        _bseConfig: undefined,

        MAX_CALLS_FOR_NEW_EXECUTE_ITERATION: 20,
        MAX_LAUNCH_COUNT: 5,
        callsForNewExecuteIteration: 0,
        launchCount: 0,

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
            /**
             * 1-я функция запланированного перезапуска сервиса.
             * Происходит после завершения MAX_LAUNCH_COUNT сборки.
             * Нужна для предотвращения случайного перезапуска сервиса в случае достижения лимита потребляемой памяти
             */
            function gracefulRestart1() {
                if (this.launchCount === this.MAX_LAUNCH_COUNT) {
                    logger.warn('Planned restart of service on reaching maximum launch count limit');
                    process.exit(1);
                } else {
                    this.launchCount++;
                }
            }

            /**
             * 2-я функция запланированного перезапуска сервиса.
             * Нужна для предотвращения "заклинивания" сборки. В случае когда сборка зависает
             * и не заканчивается успешно или с ошибокой, попытки повторной сборки будут вызываться
             * до тех пор пока их количество не превысит MAX_CALLS_FOR_NEW_EXECUTE_ITERATION
             * после чего процесс будет перезапущен
             */
            function gracefulRestart2() {
                if (this.callsForNewExecuteIteration === this.MAX_CALLS_FOR_NEW_EXECUTE_ITERATION) {
                    logger.warn('Planned restart of service on reaching maximum calls for new iteration limit');
                    process.exit(1);
                } else {
                    this.callsForNewExecuteIteration++;
                }
            }

            if (this['isActive']()) {
                this._logger.warn('Another execute process is being performed now');
                gracefulRestart2.apply(this);
                return;
            }
            this['setActive']();
            return this.__base()
                .then(function () {
                    this.callsForNewExecuteIteration = 0;
                    this['setIdle']();
                    gracefulRestart1.apply(this);
                }, this)
                .fail(function () {
                    this.callsForNewExecuteIteration = 0;
                    this['setIdle']();
                    gracefulRestart1.apply(this);
                }, this);
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
