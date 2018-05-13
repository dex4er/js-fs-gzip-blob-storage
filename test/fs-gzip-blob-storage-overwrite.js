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
const PromiseWritable = require('promise-writable')
const Pumpify = require('pumpify')
const zlib = require('zlib')

const STORAGEDIR = '/tmp/storage'

Feature('Test FsGzipBlobStorage overwrite', () => {
  const fakeFilesystem = {
    [STORAGEDIR]: {
      'exists1.gz.part': zlib.gzipSync('already exists'),
      'exists2.gz': zlib.gzipSync('already exists'),
      'exists3.gz.part': zlib.gzipSync('already exists'),
      'exists3.gz': zlib.gzipSync('already exists')
    }
  }

  Scenario('FsGzipBlobStorage produces write stream when part file exists', () => {
    const testKey = 'exists1'
    const realFilename = path.join(STORAGEDIR, testKey + '.gz.part')

    let storage
    let writable

    Before(() => {
      mockFs(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({ path: STORAGEDIR })
    })

    When('key test is passed in', () => {
      return storage.createWriteStream(testKey)
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

  Scenario('FsGzipBlobStorage produces write stream when object file exists', () => {
    const testKey = 'exists2'
    const realFilename = path.join(STORAGEDIR, testKey + '.gz.part')

    let storage
    let writable

    Before(() => {
      mockFs(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({ path: STORAGEDIR })
    })

    When('key test is passed in', () => {
      return storage.createWriteStream(testKey)
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

  Scenario('FsGzipBlobStorage commits file when object file exists', () => {
    const testKey = 'exists3'
    const realFilename = path.join(STORAGEDIR, testKey + '.gz')

    let storage

    Before(() => {
      mockFs(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({ path: STORAGEDIR })
    })

    When('key rs is passed in', () => {
      return storage.commit(testKey)
    })

    Then('rs.part should be renamed to rs', () => {
      return fs.existsSync(realFilename).should.be.true
    })

    After(() => {
      mockFs.restore()
    })
  })
})
