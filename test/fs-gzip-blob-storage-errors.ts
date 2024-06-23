import {expect} from "chai"

import {FsGzipBlobStorage} from "../src/fs-gzip-blob-storage.js"

import mockFs from "./lib/mock-fs.js"

import {Before, Feature, Given, Scenario, Then, When} from "./lib/steps.js"

const STORAGEDIR = "/tmp/storage"

Feature("Test FsGzipBlobStorage errors", () => {
  const fakeFilesystem = {
    [STORAGEDIR]: {
      "empty.gz": Buffer.alloc(0),
    },
  }

  Scenario("FsGzipBlobStorage tries to produce read stream when object does not exist", () => {
    const testKey = "notexist"

    let error: any
    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When("key test is passed in", async () => {
      try {
        await storage.createReadStream(testKey)
      } catch (e) {
        error = e
      }
    })

    Then("error is caught", () => {
      expect(error).is.an("error").and.have.property("code", "ENOENT")
    })
  })

  Scenario("FsGzipBlobStorage tries to produce read stream when object is empty", () => {
    const testKey = "empty"

    let error: any
    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When("key test is passed in", async () => {
      try {
        await storage.createReadStream(testKey)
      } catch (e) {
        error = e
      }
    })

    Then("error is caught", () => {
      expect(error).is.an("error").and.have.property("code", "ENOENT")
    })
  })

  Scenario("FsGzipBlobStorage tries to commit file when part file does not exist", () => {
    const testKey = "notexist"

    let error: any
    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When("key test is passed in", async () => {
      try {
        await storage.commit(testKey)
      } catch (e) {
        error = e
      }
    })

    Then("error is caught", () => {
      expect(error).is.an("error").and.have.property("code", "ENOENT")
    })
  })

  Scenario("FsGzipBlobStorage tries to remove file when object does not exist", () => {
    const testKey = "notexist"

    let error: any
    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When("key remove is passed in", async () => {
      try {
        await storage.remove(testKey)
      } catch (e) {
        error = e
      }
    })

    Then("error is caught", () => {
      expect(error).is.an("error").and.have.property("code", "ENOENT")
    })
  })
})
