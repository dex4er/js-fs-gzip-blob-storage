/// <reference types="node" />

import {Readable, Writable} from "stream"
import zlib from "zlib"

import Pumpify from "pumpify"

import {
  FsBlobStorage,
  FsBlobStorageCommitOptions,
  FsBlobStorageOptions,
  FsBlobStorageReadStreamOptions,
  FsBlobStorageRemoveOptions,
  FsBlobStorageWriteStreamOptions,
  DEFAULT_EXT,
} from "fs-blob-storage"

export interface FsGzipBlobStorageOptions extends FsBlobStorageOptions {
  gzipExt?: string
  gzipOptions?: zlib.ZlibOptions
}

export interface FsGzipBlobStorageReadStreamOptions extends FsBlobStorageReadStreamOptions {
  encoding?: never
}

export interface FsGzipBlobStorageWriteStreamOptions extends FsBlobStorageWriteStreamOptions {
  encoding?: never
}

export interface FsGzipBlobStorageCommitOptions extends FsBlobStorageCommitOptions {}
export interface FsGzipBlobStorageRemoveOptions extends FsBlobStorageRemoveOptions {}

export {DEFAULT_EXT, DEFAULT_PART} from "fs-blob-storage"

export const DEFAULT_GZIP_EXT = ".gz"

export class FsGzipBlobStorage {
  private storage: FsBlobStorage
  private ext: string
  private gzipExt: string
  private gzipOptions: zlib.ZlibOptions

  constructor(options: FsGzipBlobStorageOptions = {}) {
    this.storage = new FsBlobStorage(options)
    this.ext = options.ext !== undefined ? options.ext : DEFAULT_EXT
    this.gzipExt = options.gzipExt !== undefined ? options.gzipExt : DEFAULT_GZIP_EXT
    this.gzipOptions = options.gzipOptions || {}
  }

  async createWriteStream(key: string, options: FsGzipBlobStorageWriteStreamOptions = {}): Promise<Writable> {
    const {ext = this.ext} = options
    const gz = this.gzipExt

    const newOptions = Object.assign({}, options, {ext: ext + gz, encoding: null})

    const file = await this.storage.createWriteStream(key, newOptions)
    const gzip = zlib.createGzip(this.gzipOptions)
    return new Pumpify(gzip, file)
  }

  async createReadStream(key: string, options: FsGzipBlobStorageReadStreamOptions = {}): Promise<Readable> {
    const {ext = this.ext} = options
    const gz = this.gzipExt

    const newOptions = Object.assign({}, options, {ext: ext + gz, encoding: null})

    const file = await this.storage.createReadStream(key, newOptions)
    const gunzip = zlib.createGunzip(this.gzipOptions)

    return new Pumpify(file, gunzip)
  }

  commit(key: string, options: FsGzipBlobStorageCommitOptions = {}): Promise<void> {
    const {ext = this.ext} = options
    const gz = this.gzipExt

    const newOptions = Object.assign({}, options, {ext: ext + gz})

    return this.storage.commit(key, newOptions)
  }

  remove(key: string, options: FsGzipBlobStorageRemoveOptions = {}): Promise<void> {
    const {ext = this.ext} = options
    const gz = this.gzipExt

    const newOptions = Object.assign({}, options, {ext: ext + gz})

    return this.storage.remove(key, newOptions)
  }
}

export default FsGzipBlobStorage
