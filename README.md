# fs-gzip-blob-storage

<!-- markdownlint-disable MD013 -->
[![Build Status](https://secure.travis-ci.org/dex4er/js-fs-gzip-blob-storage.svg)](http://travis-ci.org/dex4er/js-fs-gzip-blob-storage) [![Coverage Status](https://coveralls.io/repos/github/dex4er/js-fs-gzip-blob-storage/badge.svg)](https://coveralls.io/github/dex4er/js-fs-gzip-blob-storage) [![npm](https://img.shields.io/npm/v/fs-gzip-blob-storage.svg)](https://www.npmjs.com/package/fs-gzip-blob-storage)
<!-- markdownlint-enable MD013 -->

Blob storage on filesystem, with gzip, streams and promises API.

This is a wrapper for
[`fs-blob-storage`](https://www.npmjs.com/package/fs-blob-storage)

## Requirements

This module requires ES6 with Node >= 6.

## Installation

```shell
npm install fs-gzip-blob-storage
```

_Additionally for Typescript:_

```shell
npm install -D @types/node
```

## Usage

```js
const { FsGzipBlobStorage } = require('fs-gzip-blob-storage')
```

_Typescript:_

```ts
import FsGzipBlobStorage from 'fs-gzip-blob-storage'
```

Transpiling this module with own settings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "fs-gzip-blob-storage": ["node_modules/fs-gzip-blob-storage/src/fs-gzip-blob-storagee"]
    }
  }
}
```

### DEFAULT_EXT

The default `ext` option is `''`

### DEFAULT_GZIP_EXT

The default `gzipExt` option is `'.gz'`

### DEFAULT_PART

The default `part` option is `'.part'`

### constructor

```js
const storage = new FsGzipBlobStorage(options)
```

_Options:_

* `ext` is a default `ext` argument for methods (optional, default: `DEFAULT_EXT`)
* `part` is a default `part` argument for methods (optional, default:
  `DEFAULT_PART`)
* `exclusive` if is true then can't create new object if already exists with
  the same key (optional, default: false)
* `gzipExt` is an extra extension for gzipped files (optional, default: `DEFAULT_GZIP_EXT`)
* `gzipOptions` is an object with options for gzip/gunzip (optional)
* `path` is a directory path of the storage (optional, default: ".")

_Example:_

```js
const storage = new FsGzipBlobStorage({
  path: '/usr/share/man',
  exclusive: true
})
```

### createWriteStream

```js
const writable = await storage.createWriteStream(key, options)
```

_Options:_

* `ext` is a default extension added to file name for the object (optional,
   default: `this.ext`)
* `part` is a extension added to file name which can be later commited
   (optional, default: `this.part`)

Creates a writable stream for a new object in the storage. Object is gzipped and
stored with the file name based on `key` and `ext` and `gzipExt` and `part`.
Throws an error if has occurred and if the file already exists for exclusive
mode.

### createReadStream

```js
const readable = await storage.createWriteStream(key, options)
```

_Options:_

* `ext` is a default extension added to file name for the object (optional,
   default: `this.ext`)

Creates a readable stream for an existing, gunzipped object in the storage.
Throws an error if has occurred or the object doesn't exist or its size is zero.

### commit

```js
await storage.commit(key, options)
```

_Options:_

* `ext` is a default extension added to file name for the object (optional,
   default: `this.ext`)
* `part` is a extension added to file name which can be later commited
   (optional, default: `this.part`)

Commits the object in the storage. It means that file name for the object is
renamed and the additional extension for partial objects is removed. Throws an
error if has occurred or the object doesn't exist.

### remove

```js
await storage.remove(key, options)
```

_Options:_

* `ext` is a default extension added to file name for the object (optional,
   default: `this.ext`)

Removes the object from the storage. Throws an error if has occurred or the
object doesn't exist.

## License

Copyright (c) 2018 Piotr Roszatycki <piotr.roszatycki@gmail.com>

[MIT](https://opensource.org/licenses/MIT)
