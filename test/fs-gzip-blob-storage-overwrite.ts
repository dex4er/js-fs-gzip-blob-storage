import {And, Before, Feature, Given, Scenario, Then, When} from "./lib/steps"

import path from "path"
import {PromiseWritable} from "promise-writable"
import Pumpify from "pumpify"
import {Writable} from "stream"
import zlib from "zlib"

import {FsGzipBlobStorage} from "../src/fs-gzip-blob-storage"

import {mockFs} from "./lib/mock-fs"

const STORAGEDIR = "/tmp/storage"

Feature("Test FsGzipBlobStorage overwrite", () => {
  const fakeFilesystem = {
    [STORAGEDIR]: {
      "exists1.gz.part": zlib.gzipSync("already exists"),
      "exists2.gz": zlib.gzipSync("already exists"),
      "exists3.gz.part": zlib.gzipSync("already exists"),
      "exists3.gz": zlib.gzipSync("already exists"),
    },
  }

  Scenario("FsGzipBlobStorage produces write stream when part file exists", () => {
    const testKey = "exists1"
    const realFilename = path.join(STORAGEDIR, testKey + ".gz.part")

    let storage: FsGzipBlobStorage
    let writable: Writable

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When("key test is passed in", async () => {
      writable = await storage.createWriteStream(testKey)
    })

    Then("created Writable should not be null", () => {
      writable.should.be.an.instanceof(Pumpify)
    })

    And(".part file should be created", () => {
      return mockFs.existsSync(realFilename).should.be.true
    })

    When("I write to the Writable stream", async () => {
      const promiseWritable = new PromiseWritable(writable)
      await promiseWritable.writeAll("new content here")
    })

    Then("new file contains the new content", () => {
      const content = zlib.gunzipSync(mockFs.readFileSync(realFilename)).toString()
      content.should.equal("new content here")
    })
  })

  Scenario("FsGzipBlobStorage produces write stream when object file exists", () => {
    const testKey = "exists2"
    const realFilename = path.join(STORAGEDIR, testKey + ".gz.part")

    let storage: FsGzipBlobStorage
    let writable: Writable

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When("key test is passed in", async () => {
      writable = await storage.createWriteStream(testKey)
    })

    Then("created Writable should not be null", () => {
      writable.should.be.an.instanceof(Pumpify)
    })

    And(".part file should be created", () => {
      return mockFs.existsSync(realFilename).should.be.true
    })

    When("I write to the Writable stream", async () => {
      const promiseWritable = new PromiseWritable(writable)
      await promiseWritable.writeAll("new content here")
    })

    Then("new file contains the new content", () => {
      const content = zlib.gunzipSync(mockFs.readFileSync(realFilename)).toString()
      content.should.equal("new content here")
    })
  })

  Scenario("FsGzipBlobStorage commits file when object file exists", () => {
    const testKey = "exists3"
    const realFilename = path.join(STORAGEDIR, testKey + ".gz")

    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When("key rs is passed in", async () => {
      await storage.commit(testKey)
    })

    Then("rs.part should be renamed to rs", () => {
      return mockFs.existsSync(realFilename).should.be.true
    })
  })
})
