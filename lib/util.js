var moment = require('moment'),
    DATE_FORMAT = 'D:M:YYYY-H:m:s';

/**
 * Builds name of snapshot as human readable date.
 * Example: 25:3:2015-15:52:46
 * @returns {*}
 */
exports.buildSnapshotName = function () {
    return moment().format(DATE_FORMAT);
};

/**
 * Sort snapshots function
 * @param {String} a - name of first snapshot for comparison
 * @param {String} b - name of second snapshot for comparison
 * @returns {*}
 */
exports.sortSnapshots = function (a, b) {
    a = moment(a, DATE_FORMAT);
    b = moment(b, DATE_FORMAT);
    return a['diff'](b);
};
