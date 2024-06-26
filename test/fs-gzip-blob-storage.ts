import path from "node:path"
import {Readable, Writable} from "node:stream"
import zlib from "node:zlib"

import {expect} from "chai"

import {PromiseReadable} from "promise-readable"
import {PromiseWritable} from "promise-writable"
import Pumpify from "pumpify"

import {FsGzipBlobStorage} from "../src/fs-gzip-blob-storage.js"

import mockFs from "./lib/mock-fs.js"

import {And, Before, Feature, Given, Scenario, Then, When} from "./lib/steps.js"

const STORAGEDIR = "/tmp/storage"

Feature("Test FsGzipBlobStorage without options", () => {
  const fakeFilesystem = {
    [STORAGEDIR]: {
      "commit.gz.part": zlib.gzipSync("another file content here"),
      "read.gz": zlib.gzipSync("file content here"),
      "remove.gz": zlib.gzipSync("more file content here"),
    },
  }

  Scenario("Make new empty FsGzipBlobStorage", () => {
    let storage: FsGzipBlobStorage

    When("new FsGzipBlobStorage object is created", () => {
      storage = new FsGzipBlobStorage()
    })

    Then("FsGzipBlobStorage object has correct type", () => {
      expect(storage).to.be.an.instanceof(FsGzipBlobStorage)
    })
  })

  Scenario("FsGzipBlobStorage produces write stream", () => {
    const testKey = "write"
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
      expect(writable).to.be.an.instanceof(Pumpify)
    })

    And(".part file should be created", () => {
      expect(mockFs.existsSync(realFilename)).to.be.true
    })

    When("I write to the Writable stream", async () => {
      const promiseWritable = new PromiseWritable(writable)
      await promiseWritable.writeAll("new content here")
      await promiseWritable.end()
    })

    Then("new file contains the new content", () => {
      const content = zlib.gunzipSync(mockFs.readFileSync(realFilename)).toString()
      expect(content).to.equal("new content here")
    })
  })

  Scenario("FsGzipBlobStorage produces read stream", () => {
    const testKey = "read"

    let readable: Readable
    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When("key test is passed in", async () => {
      readable = await storage.createReadStream(testKey)
    })

    Then("created Readable should not be null", () => {
      expect(readable).to.be.an.instanceof(Pumpify)
    })

    And("Readable should contain the content", async () => {
      const promiseReadable = new PromiseReadable(readable)
      expect(await promiseReadable.read()).to.deep.equal(Buffer.from("file content here"))
    })
  })

  Scenario("FsGzipBlobStorage commits file", () => {
    const testKey = "commit"
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
      expect(mockFs.existsSync(realFilename)).to.be.true
    })
  })

  Scenario("FsGzipBlobStorage removes file", () => {
    const testKey = "remove"
    const realFilename = path.join(STORAGEDIR, testKey + ".gz")

    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, fs: mockFs as any})
    })

    When("key remove is passed in", async () => {
      await storage.remove(testKey)
    })

    Then("remove should be removed", () => {
      expect(mockFs.existsSync(realFilename)).to.be.false
    })
  })
})
