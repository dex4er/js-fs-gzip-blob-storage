import zlib from "zlib"

import {expect} from "chai"

import {FsGzipBlobStorage} from "../src/fs-gzip-blob-storage"

import {mockFs} from "./lib/mock-fs"

import {Before, Feature, Given, Scenario, Then, When} from "./lib/steps"

const STORAGEDIR = "/tmp/storage"

Feature("Test FsGzipBlobStorage errors for exclusive option", () => {
  const fakeFilesystem = {
    [STORAGEDIR]: {
      "exists1.gz.part": zlib.gzipSync("already exists"),
      "exists2.gz": zlib.gzipSync("already exists"),
    },
  }

  Scenario("FsGzipBlobStorage tries to produce write stream when part file exists", () => {
    const testKey = "exists1"

    let error: Error
    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, exclusive: true, fs: mockFs as any})
    })

    When("key test is passed in", async () => {
      try {
        await storage.createWriteStream(testKey)
      } catch (e) {
        error = e
      }
    })

    Then("error is caught", () => {
      expect(error).is.an("error").and.have.property("code", "EEXIST")
    })
  })

  Scenario("FsGzipBlobStorage tries to produce write stream when object file exists", () => {
    const testKey = "exists2"

    let error: Error
    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, exclusive: true, fs: mockFs as any})
    })

    When("key test is passed in", async () => {
      try {
        await storage.createWriteStream(testKey)
      } catch (e) {
        error = e
      }
    })

    Then("error is caught", () => {
      expect(error).is.an("error").and.have.property("code", "EEXIST")
    })
  })
})
