const pumpify = require('pumpify')
const zlib = require('zlib')

const FsBlobStorage = require('fs-blob-storage')

const DEFAULT_EXT = ''
const DEFAUTL_GZIP_EXT = '.gz'

/**
 * @interface FsGzipBlobStorageOptions
 * @property {boolean} [exclusive]
 * @property {string} [gzipExt]
 * @property {ZlibOptions} [gzipOptions]
 * @property {string} path
 */

/**
 * @interface FsGzipBlobStorageWriteStreamOptions
 * @property {string} [ext]
 * @property {string} [part]
 */

/**
 * @interface FsGzipBlobStorageReadStreamOptions
 * @property {string} [ext]
 */

/**
 * @interface FsGzipBlobStorageCommitOptions
 * @property {string} [ext]
 * @property {string} [part]
 */

/**
 * @interface FsGzipBlobStorageRemoveOptions
 * @property {string} [ext]
 */

/**
 * @class
 * @param {FsGzipBlobStorageOptions} [options]
 */
class FsGzipBlobStorage {
  constructor (options = {}) {
    this.storage = new FsBlobStorage(options)
    this.gzipOptions = options.gzipOptions || {}
    this.gzipExt = options.gzipExt !== undefined ? options.gzipExt : DEFAUTL_GZIP_EXT
  }

  /**
   * @param {string} key
   * @param {FsGzipBlobStorageWriteStreamOptions} [options]
   * @returns {Promise<Writable>}
   */
  createWriteStream (key, options = {}) {
    const { ext = DEFAULT_EXT } = options
    const gz = this.gzipExt
    const newOptions = Object.assign({}, options, { ext: ext + gz, encoding: null })
    return this.storage.createWriteStream(key, newOptions)
      .then((file) => {
        const gzip = zlib.createGzip(this.gzipOptions)
        return pumpify(gzip, file)
      })
  }

  /**
   * @param {string} key
   * @param {FsGzipBlobStorageReadStreamOptions} [options]
   * @returns {Promise<Readable>}
   */
  createReadStream (key, options = {}) {
    const { ext = DEFAULT_EXT } = options
    const gz = this.gzipExt
    const newOptions = Object.assign({}, options, { ext: ext + gz, encoding: null })

    return this.storage.createReadStream(key, newOptions)
      .then((file) => {
        const gunzip = zlib.createGunzip(this.gzipOptions)
        return pumpify(file, gunzip)
      })
  }

  /**
   * @param {string} key
   * @param {FsGzipBlobStorageCommitOptions} [options]
   * @returns {Promise<void>}
   */
  commit (key, options = {}) {
    const { ext = DEFAULT_EXT } = options
    const gz = this.gzipExt
    const newOptions = Object.assign({}, options, { ext: ext + gz })
    return this.storage.commit(key, newOptions)
  }

  /**
   * @param {string} key
   * @param {FsGzipBlobStorageRemoveOptions} [options]
   * @returns {Promise<void>}
   */
  remove (key, options = {}) {
    const { ext = DEFAULT_EXT } = options
    const gz = this.gzipExt
    const newOptions = Object.assign({}, options, { ext: ext + gz })
    return this.storage.remove(key, newOptions)
  }
}

FsGzipBlobStorage.FsGzipBlobStorage = FsGzipBlobStorage

module.exports = FsGzipBlobStorage
