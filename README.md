# snapshot-master
Tools for suitable snapshot manipulation

[![NPM](https://nodei.co/npm/bem-site-snapshot-master.png)](https://nodei.co/npm/bem-site-snapshot-master/)

[![Coveralls branch](https://img.shields.io/coveralls/bem-site/snapshot-master/master.svg)](https://coveralls.io/r/bem-site/snapshot-master?branch=master)
[![Travis](https://img.shields.io/travis/bem-site/snapshot-master.svg)](https://travis-ci.org/bem-site/snapshot-master)
[![David](https://img.shields.io/david/bem-site/snapshot-master.svg)](https://david-dm.org/bem-site/snapshot-master)
[![David](https://img.shields.io/david/dev/bem-site/snapshot-master.svg)](https://david-dm.org/bem-site/snapshot-master#info=devDependencies)

![GitHub Logo](./logo.gif)

[RUSSIAN DOCUMENTATION](./README.ru.md)

## Usage

### As npm package

At first you should install npm package by:
```
$ npm install --save bem-site-snapshot-master
```

2 different strategies can be used via this package:

* Simple
* YDisk (snapshot operations performs also on Yandex Disk)

Both strategies have the same API.

#### API

##### constructor

You should create instance of snapshot master API class before using its methods.

```
var API = require('bem-site-snapshot-master').Simple,
api = new API(options);

// here you can call instance methods of API class
api.getSnapshots(function (err) {
    // TODO implement your handler
});
```

`options` - is object with available fields:

* `path` - full path to operation folder. (required).
* `symlinks` - array with available symlink names (required).
* `logger` - settings for logger module. See [Logger](https://www.npmjs.com/package/bem-site-logger) for more details.

For YDisk API also `yandex-disk` options section needed:

```
'yandex-disk': {
    user: 'john.smith',
    password: '12345678',
    namespace: 'test'
}
```

##### getSnapshots

Returns list of snapshot folder names.

Arguments:
* {Function} `callback` function

##### getSnapshotNameForSymlink

Returns name of snapshot which given symlink is pointed to

Arguments:
* {String} `symlink` - name of symlink
* {Function} `callback` function

##### getSnapshotDataForSymlink

Retrieves data of snapshot which given symlink is pointed to and
pipes it to destination stream

Arguments:
* {String} `symlink` - name of symlink
* {Stream} `destination` - destination stream
* {Function} `callback` function

##### getSnapshotChanges

Reads content of data.json file of given snapshot

Arguments:
* {String} `snapshot` - name of given snapshot
* {Function} `callback` function

##### switchSymlinkToSnapshot

Switch symlink to folder with given snapshot name

Arguments:
* {String} `symlink` - name of symlink
* {String} `snapshot` - name of given snapshot
* {Function} `callback` function

##### removeSnapshot

Removes snapshot by given snapshot name

Arguments:
* {String} `snapshot` - name of given snapshot
* {Function} `callback` function

## Testing

Run tests:
```
npm run mocha
```

Run tests with istanbul coverage calculation:
```
npm run istanbul
```

Run codestyle verification (jshint and jscs)
```
npm run codestyle
```

Special thanks to:

* Nikolay Ilchenko (http://github.com/tavriaforever)
* Konstantinova Gela (http://github.com/gela-d)

Maintainer @tormozz48
Please send your questions and proposals to: tormozz48@gmail.com
