'use strict'

const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

const mockFs = require('mock-fs')

const { FsGzipBlobStorage } = require('../lib/fs-gzip-blob-storage')

const STORAGEDIR = '/tmp/storage'

Feature('Test FsGzipBlobStorage errors', () => {
  const fakeFilesystem = {
    [STORAGEDIR]: {
      'empty.gz': ''
    }
  }

  Scenario('FsGzipBlobStorage tries to produce read stream when object does not exist', () => {
    const testKey = 'notexist'

    let error
    let storage

    Before(() => {
      mockFs(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({ path: STORAGEDIR })
    })

    When('key test is passed in', () => {
      return storage.createReadStream(testKey)
        .catch((err) => {
          error = err
        })
    })

    Then('error is caught', () => {
      error.should.be.an.instanceof(Error)
        .and.have.property('code').that.is.equal('ENOENT')
    })

    After(() => {
      mockFs.restore()
    })
  })

  Scenario('FsGzipBlobStorage tries to produce read stream when object is empty', () => {
    const testKey = 'empty'

    let error
    let storage

    Before(() => {
      mockFs(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({ path: STORAGEDIR })
    })

    When('key test is passed in', () => {
      return storage.createReadStream(testKey)
        .catch((err) => {
          error = err
        })
    })

    Then('error is caught', () => {
      error.should.be.an.instanceof(Error)
        .and.have.property('code').that.is.equal('ENOENT')
    })

    After(() => {
      mockFs.restore()
    })
  })

  Scenario('FsGzipBlobStorage tries to commit file when part file does not exist', () => {
    const testKey = 'notexist'

    let error
    let storage

    Before(() => {
      mockFs(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({ path: STORAGEDIR })
    })

    When('key test is passed in', () => {
      return storage.commit(testKey)
        .catch((err) => {
          error = err
        })
    })

    Then('error is caught', () => {
      error.should.be.an.instanceof(Error)
        .and.have.property('code').that.is.equal('ENOENT')
    })

    After(() => {
      mockFs.restore()
    })
  })

  Scenario('FsGzipBlobStorage tries to remove file when object does not exist', () => {
    const testKey = 'notexist'

    let error
    let storage

    Before(() => {
      mockFs(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({ path: STORAGEDIR })
    })

    When('key remove is passed in', () => {
      return storage.remove(testKey)
        .catch((err) => {
          error = err
        })
    })

    Then('error is caught', () => {
      error.should.be.an.instanceof(Error)
        .and.have.property('code').that.is.equal('ENOENT')
    })

    After(() => {
      mockFs.restore()
    })
  })
})
