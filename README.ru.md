# snapshot-master
Инструмент для удобного манипулирования версиями данных для bem-site.

[![NPM](https://nodei.co/npm/bem-site-snapshot-master.png)](https://nodei.co/npm/bem-site-snapshot-master/)

[![Coveralls branch](https://img.shields.io/coveralls/bem-site/snapshot-master/master.svg)](https://coveralls.io/r/bem-site/snapshot-master?branch=master)
[![Travis](https://img.shields.io/travis/bem-site/snapshot-master.svg)](https://travis-ci.org/bem-site/snapshot-master)
[![David](https://img.shields.io/david/bem-site/snapshot-master.svg)](https://david-dm.org/bem-site/snapshot-master)
[![David](https://img.shields.io/david/dev/bem-site/snapshot-master.svg)](https://david-dm.org/bem-site/snapshot-master#info=devDependencies)

![GitHub Logo](./logo.gif)

[ENGLISH DOCUMENTATION](./README.md)

## Использование

### Как npm пакет

Установить npm пакет:
```
$ npm install --save bem-site-snapshot-master
```

Для данного инструмента возможны две стратегии выполнения:

* Simple
* YDisk (операции с версиями данных будут также выполнены и на Yandex Disk)

Обе стратегии имеют одинаковое API.

#### API

##### constructor

Необходимо создать экземпляр класса API перед использованием его методов.

```
var API = require('bem-site-snapshot-master').Simple,
api = new API(options);

// here you can call instance methods of API class
api.getSnapshots(function (err) {
    // TODO implement your handler
});
```

`options` - это объект с полями:

* `path` - полный путь к папке с данными. (необходимое поле).
* `symlinks` - массив с названиями симлинок (необходимое поле).
* `logger` - настройки модуля логгирования. Более детально про настройки лога можно прочитать [здесь](https://www.npmjs.com/package/bem-site-logger).

Для использования API Яндекс Диск также нужно передать соответствующие настройки `yandex-disk`:

```
'yandex-disk': {
    user: 'john.smith',
    password: '12345678',
    namespace: 'test'
}
```

##### getSnapshots

Возвращает список названий снапшотов.

Аргументы:
* {Function} `callback` функция обратного вызова

##### getSnapshotNameForSymlink

Возвращает название снапшота на который указывает данная симлинка

Аргументы:
* {String} `symlink` - название симлинки
* {Function} `callback` функция обратного вызова

##### getSnapshotDataForSymlink

Получает данные снапшота на который указывает данная симлинка, считывает их 
и перенаправляет в указанный целевой поток

Аргументы:
* {String} `symlink` - название симлинки
* {Stream} `destination` - поток назначения в который будут переданы данные
* {Function} `callback` функция обратного вызова

##### getSnapshotChanges

Считывает содержимое data.json файла по названию снапшота

Аргументы:
* {String} `snapshot` - название снапшота
* {Function} `callback` функция обратного вызова

##### switchSymlinkToSnapshot

Переключает симлинку на папку в указанной версие данных

Аргументы:
* {String} `symlink` - название симлинки
* {String} `snapshot` - название снапшота
* {Function} `callback` функция обратного вызова

##### removeSnapshot

Удаляет снапшот данных по названию снапшота

Агрументы:
* {String} `snapshot` - название снапшота
* {Function} `callback` функция обратного вызова

### Использование в режиме сервиса

Основная роль snapshot-master это использование в качестве основы для 
[инструмента сборки данных](https://github.com/bem-site/bse-admin) 
который может быть запущен и управляться из данного модуля.

Для использования snapshot-master в таком режиме необходимо:

1. Склонировать репозиторий на файловую систему:
```
$ git clone https://github.com/bem-site/snapshot-master
```
2. Установить npm зависимости:
```
$ npm install
```
3. Сгенерировать конфигурационные файлы:
```
$ npm run config
```

#### Конфигурация

Конфигурация инструмента находится в 3-х сгенерированных `_*.json` файлах в папке config:

* _bse.json 
* _config.json
* _tripwire.json

##### _bse.json

##### _config.json

Содержит собственно настройки приложения

* `path` - полный путь к папке с данными. (необходимое поле).
* `name` - название сервиса. Используется для построения заголовка письма которое рассылается по результатам сборки
* `symlinks` - массив с названиями симлинок (необходимое поле). 
* `logger` - настройки модуля логгирования. Более детально про настройки лога можно прочитать [здесь](https://www.npmjs.com/package/bem-site-logger).
* `cron` - настройки cron модуля для настройки расписания выполнения сборки данных. 
Более подробно об этой опции можно прочитать [здесь](https://www.npmjs.com/package/cron-runner)
* `yandex-disk` - настройки Яндекс Диска. Необходим только в случае если операции с версиями данных
требуется дублировать и на Яндекс Диске
* `e-mail` - настройки почтовой рассылки для уведомления о создании нового снапшота данных.
Более подробно о настройках e-mail можно прочитать [здесь](https://www.npmjs.com/package/bem-site-mail-sender)

##### _tripwire.json

Содержит настройки для модуля [tripwire](https://www.npmjs.com/package/memory-tripwire).
Данный модуль предназначен для прекращения работы программы в случае достижения установленного
лимита потребления оперативной памяти.


#### Запуск

Запуск snapshot-master-а выполняется командой:
```
$ node bin/index.js
```

## Тестирование

Запуск тестов:
```
npm run mocha
```

Запуск тестов с вычислением покрытия кода тестами с помощью инструмента [istanbul](https://www.npmjs.com/package/istanbul):
```
npm run istanbul
```

Проверка синткасиса кода с помощью jshint и jscs
```
npm run codestyle
```

Особая благодарность за помощь в разработке:

* Ильченко Николай (http://github.com/tavriaforever)
* Константинова Гела (http://github.com/gela-d)

Разработчик Кузнецов Андрей Серргеевич @tormozz48
Вопросы и предложения присылать по адресу: tormozz48@gmail.com
