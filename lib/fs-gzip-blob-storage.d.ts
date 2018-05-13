/// <reference types="node" />

import Pumpify from 'pumpify'
import zlib from 'zlib'

import {
  FsBlobStorage,
  FsBlobStorageCommitOptions,
  FsBlobStorageOptions,
  FsBlobStorageReadStreamOptions,
  FsBlobStorageRemoveOptions,
  FsBlobStorageWriteStreamOptions
} from 'fs-blob-storage'

export interface FsGzipBlobStorageOptions extends FsBlobStorageOptions {
  extGz?: string
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

export class FsGzipBlobStorage {
  private readonly gzipExt: string
  private readonly gzipOptions?: zlib.ZlibOptions

  private readonly storage: FsBlobStorage

  constructor (options: FsGzipBlobStorageOptions)

  createWriteStream (key: string, options?: FsGzipBlobStorageWriteStreamOptions): Promise<Pumpify>
  createReadStream (key: string, options?: FsGzipBlobStorageReadStreamOptions): Promise<Pumpify>
  commit (key: string, options?: FsGzipBlobStorageCommitOptions): Promise<void>
  remove (key: string, options?: FsGzipBlobStorageRemoveOptions): Promise<void>
}

export default FsGzipBlobStorage
