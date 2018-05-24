# Changelog

## v0.3.2 2018-05-24

* Uses `stream.pipeline-shim` package in examples. Thank you, "npm, inc", for
  making my life harder :-/

## v0.3.1 2018-05-24

* Upgrade fs-blob-storage to v0.5.1: make storage compatible with Windows.

## v0.3.0 2018-05-19

* New constructor option `defaultExt` and `defaultPart`.
* Typescript: return `Promise<Readable>` and `Promise<Writable>` instead
  `Promise<Pumpify>`.

## v0.2.1 2018-05-19

* Fixes jsdoc types.

## v0.2.0 2018-05-18

* Uses `stream.pipeline` shim instead `pump` in example scripts.

## v0.1.0 2018-05-12

* Initial release
