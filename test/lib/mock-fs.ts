import fs from "node:fs"
import path from "node:path"
import {Readable, Writable} from "node:stream"

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

class MockFsReadable extends Readable {
  private offset = 0

  constructor(
    private fd: number,
    options: any,
  ) {
    TRACE("MockFsReadable", {fd})
    super(options)
  }

  _read(size: number): void {
    TRACE("_read", size, {fd: this.fd})
    if (size === 0) {
      return void this.push(null)
    }
    size = size || 16384
    const {filepath} = fds[this.fd] || {filepath: ""}
    if (!filepath) {
      return void this.push(null)
    }
    const {dir, base} = path.parse(filepath)
    const chunk = Uint8Array.prototype.slice.call(fakeFilesystem[dir][base], this.offset, size)
    this.offset += size
    this.push(chunk || null)
  }

  async close(): Promise<void> {
    TRACE("close", {fd: this.fd})
    if (!fds[this.fd]) {
      throw Object.assign(new Error("bad file descriptor: " + this.fd), {
        errno: -9,
        code: "EBADF",
        syscall: "close",
      })
    }
    delete fds[this.fd]
  }
}

class MockFsWritable extends Writable {
  constructor(
    private fd: number,
    options: any,
  ) {
    TRACE("MockFsWritable", {fd})
    super(options)
  }

  _write(chunk: string, encoding: string, callback: () => void): void {
    TRACE("_write", chunk, encoding, {fd: this.fd})
    const {filepath} = fds[this.fd] || {filepath: ""}
    if (filepath) {
      const {dir, base} = path.parse(filepath)
      fakeFilesystem[dir][base] = Buffer.concat([fakeFilesystem[dir][base], Buffer.from(chunk)])
    }
    TRACE("fakeFilesystem", fakeFilesystem)
    callback()
  }

  async close(): Promise<void> {
    TRACE("close", {fd: this.fd})
    if (!fds[this.fd]) {
      throw Object.assign(new Error("bad file descriptor: " + this.fd), {
        errno: -9,
        code: "EBADF",
        syscall: "close",
      })
    }
    delete fds[this.fd]
  }
}

function createReadStream(_filepath: string, options: any): MockFsReadable {
  TRACE("createReadStream", _filepath, options)
  const fd = typeof options === "object" ? options.fd.fd : options.fd
  const {filepath} = fds[fd]
  const {dir, base} = path.parse(filepath)
  if (!fakeFilesystem[dir] || !(base in fakeFilesystem[dir])) {
    throw Object.assign(new Error("no such file or directory: " + fd.filepath), {
      errno: -2,
      code: "ENOENT",
      syscall: "open",
      path: filepath,
    })
  }
  return new MockFsReadable(fd, options)
}

function createWriteStream(filepath: string, options: any): MockFsWritable {
  TRACE("createWriteStream", filepath, options)
  const fd = typeof options === "object" ? options.fd.fd : options.fd
  const {dir} = path.parse(filepath)
  if (!fakeFilesystem[dir]) {
    throw Object.assign(new Error("no such file or directory: " + filepath), {
      errno: -2,
      code: "ENOENT",
      syscall: "open",
      path: filepath,
    })
  }
  return new MockFsWritable(fd, options)
}

function existsSync(filepath: string): boolean {
  TRACE("existsSync", filepath)
  const {dir, base} = path.parse(filepath)
  return fakeFilesystem[dir] && base in fakeFilesystem[dir]
}

function init(newFakeFilesystem: FakeFilesystem): void {
  TRACE("init", newFakeFilesystem)
  fakeFilesystem = JSON.parse(JSON.stringify(newFakeFilesystem), (_key, value) =>
    value instanceof Object && value.type === "Buffer" ? Buffer.from(value.data) : value,
  )
  fds = []
}

async function mkdir(dirpath: string, options: fs.MakeDirectoryOptions): Promise<string | undefined> {
  TRACE("mkdir", dirpath, options)
  const recursive = options.recursive || false
  if (recursive) {
    fakeFilesystem[dirpath] ||= {}
    TRACE("fakeFilesystem", fakeFilesystem)
    return dirpath
  } else {
    if (fakeFilesystem[dirpath]) {
      throw Object.assign(new Error("file already exists: " + dirpath), {
        errno: -17,
        code: "EEXIST",
        syscall: "mkdir",
        path,
      })
    }
    fakeFilesystem[dirpath] = {}
    TRACE("fakeFilesystem", fakeFilesystem)
    return undefined
  }
}

async function open(filepath: string, flags: string, mode: fs.Mode): Promise<MockFsReadable | MockFsWritable> {
  TRACE("open", filepath, flags, mode)
  const {dir, base} = path.parse(filepath)
  if (flags.indexOf("w") !== -1) {
    if (!fakeFilesystem[dir]) {
      throw Object.assign(new Error("no such file or directory: " + filepath), {
        errno: -2,
        code: "ENOENT",
        syscall: "open",
        path: filepath,
      })
    }
    if (flags.indexOf("x") !== -1) {
      if (fakeFilesystem[dir][base]) {
        throw Object.assign(new Error("file already exists"), {
          errno: -17,
          code: "EEXIST",
          syscall: "open",
          path: filepath,
        })
      }
    }
    fakeFilesystem[dir][base] = Buffer.alloc(0)
    TRACE("fakeFilesystem", fakeFilesystem)
    const fd = fds.push({filepath, offset: 0}) - 1
    return new MockFsWritable(fd, {})
  }
  if (flags.indexOf("r") !== -1) {
    if (!fakeFilesystem[dir] || !(base in fakeFilesystem[dir])) {
      throw Object.assign(new Error("no such file or directory: " + filepath), {
        errno: -2,
        code: "ENOENT",
        syscall: "open",
        path: filepath,
      })
    }
    const fd = fds.push({filepath, offset: 0}) - 1
    return new MockFsReadable(fd, {})
  }
  throw new Error("unknown mode")
}

function readFileSync(filepath: string, _options?: any): Buffer {
  TRACE("readFileSync", filepath)
  const {dir, base} = path.parse(filepath)
  if (!fakeFilesystem[dir] || !(base in fakeFilesystem[dir])) {
    throw Object.assign(new Error("no such file or directory: " + filepath), {
      errno: -2,
      code: "ENOENT",
      syscall: "open",
      path: filepath,
    })
  }
  return fakeFilesystem[dir][base]
}

async function rename(src: string, dest: string): Promise<void> {
  TRACE("rename", src, dest)
  const {dir: srcdir, base: srcbase} = path.parse(src)
  const {dir: destdir, base: destbase} = path.parse(dest)
  if (!fakeFilesystem[srcdir] || !(srcbase in fakeFilesystem[srcdir]) || !fakeFilesystem[destdir]) {
    throw Object.assign(new Error("no such file or directory: " + src + " -> " + dest), {
      errno: -2,
      code: "ENOENT",
      syscall: "open",
      path: src,
      dest,
    })
  }
  fakeFilesystem[destdir][destbase] = fakeFilesystem[srcdir][srcbase]
  delete fakeFilesystem[srcdir][srcbase]
  TRACE("fakeFilesystem", fakeFilesystem)
  const fd = fds.find(f => f.filepath === src)
  if (fd) {
    fd.filepath = dest
  }
}

async function stat(filepath: string): Promise<fs.Stats> {
  TRACE("stat", filepath)
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
    throw Object.assign(new Error("no such file or directory: " + filepath), {
      errno: -2,
      code: "ENOENT",
      syscall: "stat",
      path: filepath,
    })
  }
  const time = new Date()
  const timeMs = time.getTime()
  return Object.assign(new fs.Stats(), {
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
  })
}

async function unlink(filepath: string): Promise<void> {
  TRACE("unlink", filepath)
  const {dir, base} = path.parse(filepath)
  if (!fakeFilesystem[dir] || !(base in fakeFilesystem[dir])) {
    throw Object.assign(new Error("no such file or directory: " + filepath), {
      errno: -2,
      code: "ENOENT",
      syscall: "open",
      path: filepath,
    })
  }
  delete fakeFilesystem[dir][base]
  TRACE("fakeFilesystem", fakeFilesystem)
}

const mockFs = {
  createReadStream,
  createWriteStream,
  existsSync,
  init,
  promises: {
    mkdir,
    open,
    rename,
    stat,
    unlink,
  },
  readFileSync,
}

export default mockFs
