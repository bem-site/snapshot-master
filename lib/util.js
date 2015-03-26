var moment = require('moment');

/**
 * Builds name of snapshot as human readable date.
 * Example: 25:3:2015-15:52:46
 * @returns {*}
 */
exports.buildSnapshotName = function () {
    return moment().format('D:M:YYYY-H:m:s');
};
