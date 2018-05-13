'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

const mockFs = require('mock-fs')

const { FsGzipBlobStorage } = require('../lib/fs-gzip-blob-storage')

const fs = require('fs')
const path = require('path')
const PromiseReadable = require('promise-readable')
const PromiseWritable = require('promise-writable')
const Pumpify = require('pumpify')
const zlib = require('zlib')

const STORAGEDIR = '/tmp/storage'

Feature('Test FsGzipBlobStorage with ext option', () => {
  const fakeFilesystem = {
    [STORAGEDIR]: {
      'commit.txt.part': zlib.gzipSync('another file content here'),
      'read.txt': zlib.gzipSync('file content here'),
      'remove.txt': zlib.gzipSync('more file content here')
    }
  }

  Scenario('FsGzipBlobStorage produces write stream', () => {
    const testKey = 'write'
    const realFilename = path.join(STORAGEDIR, testKey + '.txt.part')

    let storage
    let writable

    Before(() => {
      mockFs(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({ path: STORAGEDIR, gzipExt: '' })
    })

    When('key test is passed in', () => {
      return storage.createWriteStream(testKey, { ext: '.txt' })
        .then((value) => {
          writable = value
        })
    })

    Then('created Writable should not be null', () => {
      writable.should.be.an.instanceof(Pumpify)
    })

    And('.part file should be created', () => {
      return fs.existsSync(realFilename).should.be.true
    })

    When('I write to the Writable stream', () => {
      const promiseWritable = new PromiseWritable(writable)
      return promiseWritable.writeAll('new content here')
    })

    Then('new file contains the new content', () => {
      const content = zlib.gunzipSync(fs.readFileSync(realFilename)).toString()
      content.should.equal('new content here')
    })

    After(() => {
      mockFs.restore()
    })
  })

  Scenario('FsGzipBlobStorage produces read stream', () => {
    const testKey = 'read'

    let readable
    let storage

    Before(() => {
      mockFs(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({ path: STORAGEDIR, gzipExt: '' })
    })

    When('key test is passed in', () => {
      return storage.createReadStream(testKey, { ext: '.txt' })
        .then((value) => {
          readable = value
        })
    })

    Then('created Readable should not be null', () => {
      readable.should.be.an.instanceof(Pumpify)
    })

    And('Readable should contain the content', () => {
      const promiseReadable = new PromiseReadable(readable)
      return promiseReadable.read().should.eventually.deep.equal(Buffer.from('file content here'))
    })

    After(() => {
      mockFs.restore()
    })
  })

  Scenario('FsGzipBlobStorage commits file', () => {
    const testKey = 'commit'
    const realFilename = path.join(STORAGEDIR, testKey + '.txt')

    let storage

    Before(() => {
      mockFs(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({ path: STORAGEDIR, gzipExt: '' })
    })

    When('key rs is passed in', () => {
      return storage.commit(testKey, { ext: '.txt' })
    })

    Then('rs.part should be renamed to rs', () => {
      return fs.existsSync(realFilename).should.be.true
    })

    After(() => {
      mockFs.restore()
    })
  })

  Scenario('FsGzipBlobStorage removes file', () => {
    const testKey = 'remove'
    const realFilename = path.join(STORAGEDIR, testKey + '.txt')

    let storage

    Before(() => {
      mockFs(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({ path: STORAGEDIR, gzipExt: '' })
    })

    When('key remove is passed in', () => {
      return storage.remove(testKey, { ext: '.txt' })
    })

    Then('remove should be removed', () => {
      return fs.existsSync(realFilename).should.be.false
    })

    After(() => {
      mockFs.restore()
    })
  })
})
