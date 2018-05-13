'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

const mockFs = require('mock-fs')

const { FsGzipBlobStorage } = require('../lib/fs-gzip-blob-storage')

const zlib = require('zlib')

const STORAGEDIR = '/tmp/storage'

Feature('Test FsGzipBlobStorage errors for exclusive option', () => {
  const fakeFilesystem = {
    [STORAGEDIR]: {
      'exists1.gz.part': zlib.gzipSync('already exists'),
      'exists2.gz': zlib.gzipSync('already exists')
    }
  }

  Scenario('FsGzipBlobStorage tries to produce write stream when part file exists', () => {
    const testKey = 'exists1'

    let error
    let storage

    Before(() => {
      mockFs(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({ path: STORAGEDIR, exclusive: true })
    })

    When('key test is passed in', () => {
      return storage.createWriteStream(testKey)
        .catch((err) => {
          error = err
        })
    })

    Then('error is caught', () => {
      error.should.be.an.instanceof(Error)
        .and.have.property('code').that.is.equal('EEXIST')
    })

    After(() => {
      mockFs.restore()
    })
  })

  Scenario('FsGzipBlobStorage tries to produce write stream when object file exists', () => {
    const testKey = 'exists2'

    let error
    let storage

    Before(() => {
      mockFs(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({ path: STORAGEDIR, exclusive: true })
    })

    When('key test is passed in', () => {
      return storage.createWriteStream(testKey)
        .catch((err) => {
          error = err
        })
    })

    Then('error is caught', () => {
      error.should.be.an.instanceof(Error)
        .and.have.property('code').that.is.equal('EEXIST')
    })

    After(() => {
      mockFs.restore()
    })
  })
})
