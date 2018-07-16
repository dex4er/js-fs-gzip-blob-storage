'use strict'

const pumpify = require('pumpify')
const zlib = require('zlib')

const FsBlobStorage = require('fs-blob-storage')

const DEFAUTL_GZIP_EXT = '.gz'

/**
 * @class
 * @param {Object} [options]
 * @param {string} [options.defaultExt]
 * @param {string} [options.defaultPart]
 * @param {boolean} [options.exclusive]
 * @param {string} [options.extGz]
 * @param {zlib.ZlibOptions} [options.gzipOptions]
 * @param {Object} [options.fs]
 * @param {string} [options.path]
 */
class FsGzipBlobStorage {
  constructor (options = {}) {
    this.storage = new FsBlobStorage(options)
    this.gzipOptions = options.gzipOptions || {}
    this.gzipExt = options.gzipExt !== undefined ? options.gzipExt : DEFAUTL_GZIP_EXT
  }

  /**
   * @async
   * @param {string} key
   * @param {Object} [options]
   * @param {string} [options.ext]
   * @param {string} [options.part]
   * @returns {Promise<stream.Writable>}
   */
  createWriteStream (key, options = {}) {
    const { ext = this.storage.defaultExt } = options
    const gz = this.gzipExt
    const newOptions = Object.assign({}, options, { ext: ext + gz, encoding: null })
    return this.storage.createWriteStream(key, newOptions)
      .then((file) => {
        const gzip = zlib.createGzip(this.gzipOptions)
        return pumpify(gzip, file)
      })
  }

  /**
   * @async
   * @param {string} key
   * @param {Object} [options]
   * @param {string} [options.ext]
   * @returns {Promise<stream.Readable>}
   */
  createReadStream (key, options = {}) {
    const { ext = this.storage.defaultExt } = options
    const gz = this.gzipExt
    const newOptions = Object.assign({}, options, { ext: ext + gz, encoding: null })

    return this.storage.createReadStream(key, newOptions)
      .then((file) => {
        const gunzip = zlib.createGunzip(this.gzipOptions)
        return pumpify(file, gunzip)
      })
  }

  /**
   * @async
   * @param {string} key
   * @param {Object} [options]
   * @param {string} [options.ext]
   * @param {string} [options.part]
   * @returns {Promise<undefined>}
   */
  commit (key, options = {}) {
    const { ext = this.storage.defaultExt } = options
    const gz = this.gzipExt
    const newOptions = Object.assign({}, options, { ext: ext + gz })
    return this.storage.commit(key, newOptions)
  }

  /**
   * @async
   * @param {string} key
   * @param {Object} [options]
   * @param {string} [options.ext]
   * @returns {Promise<undefined>}
   */
  remove (key, options = {}) {
    const { ext = this.storage.defaultExt } = options
    const gz = this.gzipExt
    const newOptions = Object.assign({}, options, { ext: ext + gz })
    return this.storage.remove(key, newOptions)
  }
}

FsGzipBlobStorage.FsGzipBlobStorage = FsGzipBlobStorage

module.exports = FsGzipBlobStorage
