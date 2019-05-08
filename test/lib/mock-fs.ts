// tslint:disable:max-classes-per-file typedef

import fs from 'fs'
import path from 'path'
import {Readable, Writable} from 'stream'

interface FakeFilesystemEntry {
  [path: string]: Buffer
}

interface FakeFilesystem {
  [dir: string]: FakeFilesystemEntry
}

interface FdsCache {
  filepath: string
  offset: number
}

let fakeFilesystem: FakeFilesystem = {}
let fds: FdsCache[] = []

function TRACE(...args: any[]): void {
  if (process.env.TEST_TRACE_MOCK_FS) {
    console.debug(...args)
  }
}

export class MockFsReadable extends Readable {
  private offset = 0

  constructor(private fd: number, options: any) {
    super(options)
  }

  _read(size: number): void {
    TRACE('_read', size, {fd: this.fd})
    if (size === 0) {
      return void this.push(null)
    }
    size = size || 16384
    const {filepath} = fds[this.fd] || {filepath: ''}
    if (!filepath) {
      return void this.push(null)
    }
    const {dir, base} = path.parse(filepath)
    if (!fakeFilesystem[dir][base]) {
      return void this.push(null)
    }
    const chunk = fakeFilesystem[dir][base].slice(this.offset, size)
    this.offset += size
    this.push(chunk || null)
  }
}

export class MockFsWritable extends Writable {
  constructor(private fd: number, options: any) {
    super(options)
  }

  _write(chunk: string, encoding: string, callback: () => void): void {
    TRACE('_write', chunk, encoding, {fd: this.fd})
    const {filepath} = fds[this.fd] || {filepath: ''}
    if (filepath) {
      const {dir, base} = path.parse(filepath)
      fakeFilesystem[dir][base] = Buffer.concat([fakeFilesystem[dir][base], Buffer.from(chunk)])
    }
    callback()
  }
}

export function close(fd: number, callback: (err: NodeJS.ErrnoException) => void): void {
  TRACE('close', fd)
  if (fds[fd]) {
    delete fds[fd]
    return process.nextTick(callback, null)
  } else {
    return process.nextTick(
      callback,
      Object.assign(new Error('bad file descriptor: ' + fd), {errno: -9, code: 'EBADF', syscall: 'close'}),
    )
  }
}

export function createReadStream(_filepath: string, options: any): MockFsReadable {
  TRACE('createReadStream', _filepath, options)
  const {fd} = options
  const {filepath} = fds[fd]
  const {dir, base} = path.parse(filepath)
  if (!fakeFilesystem[dir] || !(base in fakeFilesystem[dir])) {
    throw Object.assign(new Error('no such file or directory: ' + fd.filepath), {
      errno: -2,
      code: 'ENOENT',
      syscall: 'open',
      path: filepath,
    })
  }
  return new MockFsReadable(fd, options)
}

export function createWriteStream(filepath: string, options: any): MockFsWritable {
  TRACE('createWriteStream', filepath, options)
  const {fd} = options
  const {dir} = path.parse(filepath)
  if (!fakeFilesystem[dir]) {
    throw Object.assign(new Error('no such file or directory: ' + filepath), {
      errno: -2,
      code: 'ENOENT',
      syscall: 'open',
      path: filepath,
    })
  }
  return new MockFsWritable(fd, options)
}

export function existsSync(filepath: string): boolean {
  TRACE('existsSync', filepath)
  const {dir, base} = path.parse(filepath)
  return fakeFilesystem[dir] && base in fakeFilesystem[dir]
}

export function init(newFakeFilesystem: FakeFilesystem): void {
  fakeFilesystem = JSON.parse(JSON.stringify(newFakeFilesystem), (_key, value) =>
    value instanceof Object && value.type === 'Buffer' ? Buffer.from(value.data) : value,
  )
  fds = []
}

export function mkdir(dirpath: string, mode: number, callback: (err: NodeJS.ErrnoException) => void): void
export function mkdir(dirpath: string, callback: (err: NodeJS.ErrnoException) => void): void

export function mkdir(
  dirpath: string,
  mode: number | ((err: NodeJS.ErrnoException) => void),
  callback?: (err: NodeJS.ErrnoException) => void,
): void {
  TRACE('mkdir', dirpath, mode)
  if (typeof mode === 'function') {
    callback = mode
    mode = 0o777
  }
  if (callback) {
    if (fakeFilesystem[dirpath]) {
      return process.nextTick(
        callback,
        Object.assign(new Error('file already exists: ' + dirpath), {
          errno: -17,
          code: 'EEXIST',
          syscall: 'mkdir',
          path: dirpath,
        }),
      )
    }
    fakeFilesystem[dirpath] = {}
    process.nextTick(callback, null)
  }
}

export function open(filepath: string, flags: string, callback: (err: NodeJS.ErrnoException) => void): void {
  TRACE('open', filepath, flags)
  const {dir, base} = path.parse(filepath)
  if (flags.indexOf('w') !== -1) {
    if (!fakeFilesystem[dir]) {
      return process.nextTick(
        callback,
        Object.assign(new Error('no such file or directory: ' + filepath), {
          errno: -2,
          code: 'ENOENT',
          syscall: 'open',
          path: filepath,
        }),
      )
    }
    if (flags.indexOf('x') !== -1) {
      if (fakeFilesystem[dir][base]) {
        return process.nextTick(
          callback,
          Object.assign(new Error('file already exists'), {
            errno: -17,
            code: 'EEXIST',
            syscall: 'open',
            path: filepath,
          }),
        )
      }
    }
    fakeFilesystem[dir][base] = Buffer.alloc(0)
    return process.nextTick(callback, null, fds.push({filepath, offset: 0}) - 1)
  }
  if (flags.indexOf('r') !== -1) {
    if (!fakeFilesystem[dir] || !(base in fakeFilesystem[dir])) {
      return process.nextTick(
        callback,
        Object.assign(new Error('no such file or directory: ' + filepath), {
          errno: -2,
          code: 'ENOENT',
          syscall: 'open',
          path: filepath,
        }),
      )
    }
    return process.nextTick(callback, null, fds.push({filepath, offset: 0}) - 1)
  }
}

export function readFileSync(filepath: string, _options?: any): Buffer {
  TRACE('readFileSync', filepath)
  const {dir, base} = path.parse(filepath)
  if (!fakeFilesystem[dir] || !(base in fakeFilesystem[dir])) {
    throw Object.assign(new Error('no such file or directory: ' + filepath), {
      errno: -2,
      code: 'ENOENT',
      syscall: 'open',
      path: filepath,
    })
  }
  return fakeFilesystem[dir][base]
}

export function rename(src: string, dest: string, callback: (err: NodeJS.ErrnoException) => void): void {
  TRACE('rename', src, dest)
  const {dir: srcdir, base: srcbase} = path.parse(src)
  const {dir: destdir, base: destbase} = path.parse(dest)
  if (!fakeFilesystem[srcdir] || !(srcbase in fakeFilesystem[srcdir]) || !fakeFilesystem[destdir]) {
    return process.nextTick(
      callback,
      Object.assign(new Error('no such file or directory: ' + src + ' -> ' + dest), {
        errno: -2,
        code: 'ENOENT',
        syscall: 'open',
        path: src,
        dest,
      }),
    )
  }
  fakeFilesystem[destdir][destbase] = fakeFilesystem[srcdir][srcbase]
  delete fakeFilesystem[srcdir][srcbase]
  const fd = fds.find(f => f.filepath === src)
  if (fd) {
    fd.filepath = dest
  }
  process.nextTick(callback, null)
}

export function stat(filepath: string, callback: (err: NodeJS.ErrnoException, stats: fs.Stats) => void) {
  TRACE('stat', filepath)
  const {dir, base} = path.parse(filepath)
  let mode: number
  let size: number
  if (fakeFilesystem[filepath]) {
    mode = 0o40755
    size = 1024
  } else if (fakeFilesystem[dir] && fakeFilesystem[dir][base]) {
    mode = 0o00644
    size = fakeFilesystem[dir][base].length
  } else {
    return process.nextTick(
      callback,
      Object.assign(new Error('no such file or directory: ' + filepath), {
        errno: -2,
        code: 'ENOENT',
        syscall: 'stat',
        path: filepath,
      }),
    )
  }
  const time = new Date()
  const timeMs = time.getTime()
  process.nextTick(
    callback,
    null,
    Object.assign(new fs.Stats(), {
      dev: 1,
      mode,
      nlink: 1,
      uid: 0,
      gid: 0,
      rdev: 0,
      blksize: 0,
      ino: 1,
      size,
      blocks: 0,
      atimeMs: timeMs,
      mtimeMs: timeMs,
      ctimeMs: timeMs,
      birthtimeMs: timeMs,
      atime: time,
      mtime: time,
      ctime: time,
      birthtime: time,
    }),
  )
}

export function unlink(filepath: string, callback: (err: NodeJS.ErrnoException) => void): void {
  TRACE('unlink', filepath)
  const {dir, base} = path.parse(filepath)
  if (!fakeFilesystem[dir] || !(base in fakeFilesystem[dir])) {
    return process.nextTick(
      callback,
      Object.assign(new Error('no such file or directory: ' + filepath), {
        errno: -2,
        code: 'ENOENT',
        syscall: 'open',
        path: filepath,
      }),
    )
  }
  delete fakeFilesystem[dir][base]
  process.nextTick(callback, null)
}

const mockFs = {
  close,
  createReadStream,
  createWriteStream,
  existsSync,
  init,
  mkdir,
  open,
  readFileSync,
  rename,
  stat,
  unlink,
}

export default mockFs
