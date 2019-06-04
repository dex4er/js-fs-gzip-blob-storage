import chai, {expect} from "chai"

import dirtyChai from "dirty-chai"
chai.use(dirtyChai)

import {And, Before, Feature, Given, Scenario, Then, When} from "./lib/steps"

import path from "path"
import {PromiseReadable} from "promise-readable"
import {PromiseWritable} from "promise-writable"
import Pumpify from "pumpify"
import {Readable, Writable} from "stream"
import zlib from "zlib"

import {FsGzipBlobStorage} from "../src/fs-gzip-blob-storage"

import {mockFs} from "./lib/mock-fs"

const STORAGEDIR = "/tmp/storage"

Feature("Test FsGzipBlobStorage with empty gzipExt option", () => {
  const fakeFilesystem = {
    [STORAGEDIR]: {
      "commit.txt.part": zlib.gzipSync("another file content here"),
      "read.txt": zlib.gzipSync("file content here"),
      "remove.txt": zlib.gzipSync("more file content here"),
    },
  }

  Scenario("FsGzipBlobStorage produces write stream", () => {
    const testKey = "write"
    const realFilename = path.join(STORAGEDIR, testKey + ".txt.part")

    let storage: FsGzipBlobStorage
    let writable: Writable

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, gzipExt: "", fs: mockFs as any})
    })

    When("key test is passed in", async () => {
      await storage.createWriteStream(testKey, {ext: ".txt"}).then(value => {
        writable = value
      })
    })

    Then("created Writable should not be null", () => {
      expect(writable).to.be.an.instanceof(Pumpify)
    })

    And(".part file should be created", () => {
      expect(mockFs.existsSync(realFilename)).to.be.true()
    })

    When("I write to the Writable stream", async () => {
      const promiseWritable = new PromiseWritable(writable)
      await promiseWritable.writeAll("new content here")
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
      storage = new FsGzipBlobStorage({path: STORAGEDIR, gzipExt: "", fs: mockFs as any})
    })

    When("key test is passed in", async () => {
      readable = await storage.createReadStream(testKey, {ext: ".txt"})
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
    const realFilename = path.join(STORAGEDIR, testKey + ".txt")

    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, gzipExt: "", fs: mockFs as any})
    })

    When("key rs is passed in", async () => {
      await storage.commit(testKey, {ext: ".txt"})
    })

    Then("rs.part should be renamed to rs", () => {
      expect(mockFs.existsSync(realFilename)).to.be.true()
    })
  })

  Scenario("FsGzipBlobStorage removes file", () => {
    const testKey = "remove"
    const realFilename = path.join(STORAGEDIR, testKey + ".txt")

    let storage: FsGzipBlobStorage

    Before(() => {
      mockFs.init(fakeFilesystem)
    })

    Given("FsGzipBlobStorage object", () => {
      storage = new FsGzipBlobStorage({path: STORAGEDIR, gzipExt: "", fs: mockFs as any})
    })

    When("key remove is passed in", async () => {
      await storage.remove(testKey, {ext: ".txt"})
    })

    Then("remove should be removed", () => {
      expect(mockFs.existsSync(realFilename)).to.be.false()
    })
  })
})
