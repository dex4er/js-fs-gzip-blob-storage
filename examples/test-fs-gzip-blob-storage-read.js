#!/usr/bin/env node

require("stream.pipeline-shim/auto")

const stream = require("stream")
const util = require("util")

const {FsGzipBlobStorage} = require("../lib/fs-gzip-blob-storage")

const pipelinePromise = util.promisify(stream.pipeline)

const SPOOLDIR = process.env.SPOOLDIR || "."
const DEBUG = Boolean(process.env.DEBUG)

async function main() {
  const storage = new FsGzipBlobStorage({path: SPOOLDIR})

  const key = process.argv[2]

  if (!key) {
    console.error(`Usage: ${process.argv[1]} key`)
    process.exit(1)
  }

  const readable = await storage.createReadStream(key)
  if (DEBUG) console.debug("createReadStream returned")

  // extra debug trace
  if (DEBUG) {
    for (const s of [readable, readable._readable, process.stdout]) {
      for (const event of ["close", "data", "drain", "end", "error", "finish", "pipe", "readable", "unpipe"]) {
        if (s === process.stdout && ["data", "readable"].includes(event)) continue
        const name = s === process.stdout ? "stdout" : s.constructor.name
        s.on(event, arg =>
          console.debug(`${name} emitted ${event}:`, typeof arg === "object" ? arg.constructor.name : arg),
        )
      }
    }
  }

  if (DEBUG) console.info(`Reading from ${SPOOLDIR}/${key} ...`)

  await pipelinePromise(readable, process.stdout)

  if (DEBUG) console.debug("stream ended")
  if (DEBUG) console.info("Done.")
}

main().catch(err => console.error(err))
