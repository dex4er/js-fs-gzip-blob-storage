/// <reference types="node" />

import { Readable, Writable } from 'stream'
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
  constructor (options: FsGzipBlobStorageOptions)

  createWriteStream (key: string, options?: FsGzipBlobStorageWriteStreamOptions): Promise<Writable>
  createReadStream (key: string, options?: FsGzipBlobStorageReadStreamOptions): Promise<Readable>
  commit (key: string, options?: FsGzipBlobStorageCommitOptions): Promise<void>
  remove (key: string, options?: FsGzipBlobStorageRemoveOptions): Promise<void>
}

export default FsGzipBlobStorage
