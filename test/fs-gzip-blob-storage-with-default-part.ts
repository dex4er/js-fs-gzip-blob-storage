import {And, Before, Feature, Given, Scenario, Then, When} from './lib/steps'

import path from 'path'
import {PromiseReadable} from 'promise-readable'
import {PromiseWritable} from 'promise-writable'
import Pumpify from 'pumpify'
import {Readable, Writable} from 'stream'
import zlib from 'zlib'

import {FsGzipBlobStorage} from '../src/fs-gzip-blob-storage'

import {mockFs} from './lib/mock-fs'

const STORAGEDIR = '/tmp/storage'

Feature('Test FsGzipBlobStorage with part option', () => {
  const fakeFilesystem = {
    [STORAGEDIR]: {
      'commit.gz.lock': zlib.gzipSync('another file content here'),
      'read.gz': zlib.gzipSync('file content here'),
      'remove.gz': zlib.gzipSync('more file content here'),
    },
  }

  Scenario('FsGzipBlobStorage produces write stream', () => {
    const testKey = 'write'
    const realFilename = path.join(STORAGEDIR, testKey + '.gz.lock')

    let storage: FsGzipBlobStorage
    let writable: Writable

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, part: '.lock', fs: mockFs as any})
    })

    When('key test is passed in', async () => {
      writable = await storage.createWriteStream(testKey)
    })

    Then('created Writable should not be null', () => {
      writable.should.be.an.instanceof(Pumpify)
    })

    And('.part file should be created', () => {
      return mockFs.existsSync(realFilename).should.be.true
    })

    When('I write to the Writable stream', async () => {
      const promiseWritable = new PromiseWritable(writable)
      await promiseWritable.writeAll('new content here')
    })

    Then('new file contains the new content', () => {
      const content = zlib.gunzipSync(mockFs.readFileSync(realFilename)).toString()
      content.should.equal('new content here')
    })
  })

  Scenario('FsGzipBlobStorage produces read stream', () => {
    const testKey = 'read'

    let readable: Readable
    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When('key test is passed in', async () => {
      readable = await storage.createReadStream(testKey)
    })

    Then('created Readable should not be null', () => {
      readable.should.be.an.instanceof(Pumpify)
    })

    And('Readable should contain the content', async () => {
      const promiseReadable = new PromiseReadable(readable)
      await promiseReadable.read().should.eventually.deep.equal(Buffer.from('file content here'))
    })
  })

  Scenario('FsGzipBlobStorage commits file', () => {
    const testKey = 'commit'
    const realFilename = path.join(STORAGEDIR, testKey + '.gz')

    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, part: '.lock', fs: mockFs as any})
    })

    When('key rs is passed in', async () => {
      await storage.commit(testKey)
    })

    Then('rs.part should be renamed to rs', () => {
      return mockFs.existsSync(realFilename).should.be.true
    })
  })

  Scenario('FsGzipBlobStorage removes file', () => {
    const testKey = 'remove'
    const realFilename = path.join(STORAGEDIR, testKey + '.gz')

    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When('key remove is passed in', async () => {
      await storage.remove(testKey)
    })

    Then('remove should be removed', () => {
      return mockFs.existsSync(realFilename).should.be.false
    })
  })
})
