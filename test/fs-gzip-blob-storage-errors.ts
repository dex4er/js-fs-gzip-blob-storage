import {Before, Feature, Given, Scenario, Then, When} from './lib/steps'

import FsGzipBlobStorage from '../src/fs-gzip-blob-storage'

import mockFs from './lib/mock-fs'

const STORAGEDIR = '/tmp/storage'

Feature('Test FsGzipBlobStorage errors', () => {
  const fakeFilesystem = {
    [STORAGEDIR]: {
      'empty.gz': Buffer.alloc(0),
    },
  }

  Scenario('FsGzipBlobStorage tries to produce read stream when object does not exist', () => {
    const testKey = 'notexist'

    let error: Error
    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When('key test is passed in', async () => {
      try {
        await storage.createReadStream(testKey)
      } catch (e) {
        error = e
      }
    })

    Then('error is caught', () => {
      error.should.be.an
        .instanceof(Error)
        .and.have.property('code')
        .that.is.equal('ENOENT')
    })
  })

  Scenario('FsGzipBlobStorage tries to produce read stream when object is empty', () => {
    const testKey = 'empty'

    let error: Error
    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When('key test is passed in', async () => {
      try {
        await storage.createReadStream(testKey)
      } catch (e) {
        error = e
      }
    })

    Then('error is caught', () => {
      error.should.be.an
        .instanceof(Error)
        .and.have.property('code')
        .that.is.equal('ENOENT')
    })
  })

  Scenario('FsGzipBlobStorage tries to commit file when part file does not exist', () => {
    const testKey = 'notexist'

    let error: Error
    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When('key test is passed in', async () => {
      try {
        await storage.commit(testKey)
      } catch (e) {
        error = e
      }
    })

    Then('error is caught', () => {
      error.should.be.an
        .instanceof(Error)
        .and.have.property('code')
        .that.is.equal('ENOENT')
    })
  })

  Scenario('FsGzipBlobStorage tries to remove file when object does not exist', () => {
    const testKey = 'notexist'

    let error: Error
    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given('FsGzipBlobStorage object', () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When('key remove is passed in', async () => {
      try {
        await storage.remove(testKey)
      } catch (e) {
        error = e
      }
    })

    Then('error is caught', () => {
      error.should.be.an
        .instanceof(Error)
        .and.have.property('code')
        .that.is.equal('ENOENT')
    })
  })
})
