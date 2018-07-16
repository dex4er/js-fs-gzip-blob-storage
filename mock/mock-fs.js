const fs = require('fs')
const path = require('path')
const { Readable, Writable } = require('stream')

let fakeFilesystem = {}
let fds = []

function TRACE (...args) {
  if (process.env.TEST_TRACE_MOCK_FS) {
    console.log(...args)
  }
}

class MockFsReadable extends Readable {
  constructor (fd, options) {
    super(options)
    this.fd = fd
    this.offset = 0
  }
  _read (size) {
    TRACE('_read', size, { fd: this.fd })
    if (size === 0) {
      this.push(null)
    } else {
      size = size || 16384
      const { filepath } = fds[this.fd] || {}
      if (filepath) {
        const { dir, base } = path.parse(filepath)
        const chunk = fakeFilesystem[dir][base].slice(this.offset, size)
        this.offset += size
        this.push(chunk || null)
      } else {
        this.push(null)
      }
    }
  }
}

class MockFsWritable extends Writable {
  constructor (fd, options) {
    super(options)
    this.fd = fd
    this.offset = 0
  }
  _write (chunk, encoding, callback) {
    TRACE('_write', chunk, encoding, { fd: this.fd })
    const { filepath } = fds[this.fd] || {}
    if (filepath) {
      const { dir, base } = path.parse(filepath)
      fakeFilesystem[dir][base] = Buffer.concat([fakeFilesystem[dir][base], chunk])
    }
    callback()
  }
}

function close (fd, callback) {
  TRACE('close', fd)
  if (fds[fd]) {
    delete fds[fd]
    return process.nextTick(callback, null)
  } else {
    return process.nextTick(callback, Object.assign(new Error('bad file descriptor: ' + fd), { errno: -9, code: 'EBADF', syscall: 'close' }))
  }
}

function createReadStream (_filepath, options) {
  TRACE('createReadStream', _filepath, options)
  const { fd } = options
  const { filepath } = fds[fd]
  const { dir, base } = path.parse(filepath)
  if (!fakeFilesystem[dir] || !(base in fakeFilesystem[dir])) {
    throw Object.assign(new Error('no such file or directory: ' + fd.filepath), { errno: -2, code: 'ENOENT', syscall: 'open', path: filepath })
  }
  return new MockFsReadable(fd, options)
}

function createWriteStream (filepath, options) {
  TRACE('createWriteStream', filepath, options)
  const { fd } = options
  const { dir } = path.parse(filepath)
  if (!fakeFilesystem[dir]) {
    throw Object.assign(new Error('no such file or directory: ' + filepath), { errno: -2, code: 'ENOENT', syscall: 'open', path: filepath })
  }
  return new MockFsWritable(fd, options)
}

function existsSync (filepath) {
  TRACE('existsSync', filepath)
  const { dir, base } = path.parse(filepath)
  return fakeFilesystem[dir] && base in fakeFilesystem[dir]
}

function init (newFakeFilesystem) {
  fakeFilesystem = JSON.parse(JSON.stringify(newFakeFilesystem), (key, value) => { return ((value instanceof Object) && (value.type == 'Buffer')) ? Buffer.from(value.data) : value })
  fds = []
}

function mkdir (dirpath, mode, callback) {
  TRACE('mkdir', dirpath, mode)
  if (typeof mode === 'function') {
    callback = mode
    mode = 0o777
  }
  if (fakeFilesystem[dirpath]) {
    return process.nextTick(callback, Object.assign(new Error('file already exists: ' + dirpath), { errno: -17, code: 'EEXIST', syscall: 'mkdir', path: dirpath }))
  }
  fakeFilesystem[dirpath] = {}
  process.nextTick(callback, null)
}

function open (filepath, flags, callback) {
  TRACE('open', filepath, flags)
  const { dir, base } = path.parse(filepath)
  if (flags.indexOf('w') !== -1) {
    if (!fakeFilesystem[dir]) {
      return process.nextTick(callback, Object.assign(new Error('no such file or directory: ' + filepath), { errno: -2, code: 'ENOENT', syscall: 'open', path: filepath }))
    }
    if (flags.indexOf('x') !== -1) {
      if (fakeFilesystem[dir][base]) {
        return process.nextTick(callback, Object.assign(new Error('file already exists'), { errno: -17, code: 'EEXIST', syscall: 'open', path: filepath }))
      }
    }
    fakeFilesystem[dir][base] = Buffer.alloc(0)
    return process.nextTick(callback, null, fds.push({ filepath, offset: 0 }) - 1)
  }
  if (flags.indexOf('r') !== -1) {
    if (!fakeFilesystem[dir] || !(base in fakeFilesystem[dir])) {
      return process.nextTick(callback, Object.assign(new Error('no such file or directory: ' + filepath), { errno: -2, code: 'ENOENT', syscall: 'open', path: filepath }))
    }
    return process.nextTick(callback, null, fds.push({ filepath, offset: 0 }) - 1)
  }
}

function readFileSync (filepath) {
  TRACE('readFileSync', filepath)
  const { dir, base } = path.parse(filepath)
  if (!fakeFilesystem[dir] || !(base in fakeFilesystem[dir])) {
    throw Object.assign(new Error('no such file or directory: ' + filepath), { errno: -2, code: 'ENOENT', syscall: 'open', path: filepath })
  }
  return fakeFilesystem[dir][base]
}

function rename (src, dest, callback) {
  TRACE('rename', src, dest)
  const { dir: srcdir, base: srcbase } = path.parse(src)
  const { dir: destdir, base: destbase } = path.parse(dest)
  if (!fakeFilesystem[srcdir] || !(srcbase in fakeFilesystem[srcdir]) || !fakeFilesystem[destdir]) {
    return process.nextTick(callback, Object.assign(new Error('no such file or directory: ' + src + ' -> ' + dest), { errno: -2, code: 'ENOENT', syscall: 'open', path: src, dest }))
  }
  fakeFilesystem[destdir][destbase] = fakeFilesystem[srcdir][srcbase]
  delete fakeFilesystem[srcdir][srcbase]
  const fd = fds.find((f) => f.filepath === src)
  if (fd) {
    fd.filepath = dest
  }
  process.nextTick(callback, null)
}

function stat (filepath, callback) {
  TRACE('stat', filepath)
  const { dir, base } = path.parse(filepath)
  let mode
  if (fakeFilesystem[filepath]) {
    mode = 0o40755
  } else if (fakeFilesystem[dir] && fakeFilesystem[dir][base]) {
    mode = 0o00644
  } else {
    return process.nextTick(callback, Object.assign(new Error('no such file or directory: ' + filepath), { errno: -2, code: 'ENOENT', syscall: 'stat', path: filepath }))
  }
  const time = new Date()
  const timeMs = time.getTime()
  process.nextTick(callback, null, Object.assign(new fs.Stats(), {
    dev: 1,
    mode,
    nlink: 1,
    uid: 0,
    gid: 0,
    rdev: 0,
    blksize: 0,
    ino: 1,
    size: 1024,
    blocks: 0,
    atimeMs: timeMs,
    mtimeMs: timeMs,
    ctimeMs: timeMs,
    birthtimeMs: timeMs,
    atime: time,
    mtime: time,
    ctime: time,
    birthtime: time
  }))
}

function unlink (filepath, callback) {
  TRACE('unlink', filepath)
  const { dir, base } = path.parse(filepath)
  if (!fakeFilesystem[dir] || !(base in fakeFilesystem[dir])) {
    return process.nextTick(callback, Object.assign(new Error('no such file or directory: ' + filepath), { errno: -2, code: 'ENOENT', syscall: 'open', path: filepath }))
  }
  delete fakeFilesystem[dir][base]
  process.nextTick(callback, null)
}

module.exports = {
  close,
  createReadStream,
  createWriteStream,
  existsSync,
  fakeFilesystem,
  init,
  mkdir,
  open,
  readFileSync,
  rename,
  stat,
  unlink
}
