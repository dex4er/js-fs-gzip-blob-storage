#!/usr/bin/env ts-node

import FsGzipBlobStorage from '../lib/fs-gzip-blob-storage'

import pump from 'pump'
import util from 'util'

const pumpPromise: (...streams: pump.Stream[]) => Promise<void> = util.promisify(pump)

const SPOOLDIR = process.env.SPOOLDIR || '.'
const DEBUG = Boolean(process.env.DEBUG)

async function main (): Promise<void> {
  const storage = new FsGzipBlobStorage({ path: SPOOLDIR, exclusive: true })

  const key = process.argv[2]

  if (!key) {
    console.error(`Usage: ${process.argv[1]} key`)
    process.exit(1)
  }

  const stream = await storage.createWriteStream(key)
  if (DEBUG) console.debug('createWriteStream returned')

  // extra debug trace
  // tslint:disable:no-unnecessary-type-assertion
  if (DEBUG) {
    for (const s of [process.stdin, stream] as any[]) {
      for (const event of ['close', 'data', 'drain', 'end', 'error', 'finish', 'pipe', 'readable', 'unpipe']) {
        const name = s === process.stdin ? 'stdin' : s.constructor.name
        s.on(event, (arg?: any) => console.debug(`${name} emitted ${event}:`, typeof arg === 'object' ? arg.constructor.name : arg))
      }
    }
  }

  if (DEBUG) console.info(`Writing to ${SPOOLDIR}/${key} ...`)

  await pumpPromise(process.stdin, stream)

  if (DEBUG) console.debug('stream finished')

  await storage.commit(key)
  if (DEBUG) console.info('Done.')
}

main().catch((err) => console.error(err))
