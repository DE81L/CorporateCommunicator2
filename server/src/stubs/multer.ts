// Лёгкая заглушка multer: сохраняет тело запроса в файл
import type { RequestHandler } from 'express'
import fs from 'fs'
import path from 'path'

interface Options {
  dest: string
}

function multer(opts: Options) {
  return {
    single(_field: string): RequestHandler {
      return (req, _res, next) => {
        const parts: Buffer[] = []
        req.on('data', chunk => parts.push(chunk))
        req.on('end', () => {
          const filename = Date.now() + '.bin'
          const filepath = path.join(opts.dest, filename)
          fs.writeFile(filepath, Buffer.concat(parts), err => {
            if (!err) (req as any).file = { filename }
            next(err as any)
          })
        })
      }
    }
  }
}

export default multer
