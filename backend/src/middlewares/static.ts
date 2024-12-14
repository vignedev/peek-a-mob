import { Protocol, RequestHandler, Response } from "restana";
import { stat } from "fs/promises";
import path from "path";
import { createReadStream, Stats } from "fs";
// @ts-ignore
import mime from 'mime'

const statNoEnoent = async (file: string): Promise<Stats | null> => {
  try {
    return await stat(file)
  } catch (err: any) {
    if (err?.code == 'ENOENT')
      return null
    throw err
  }
}

export const createStaticServer = (root: string, spa: string): RequestHandler<Protocol.HTTP> => {
  const requestedSpa = path.join(root, spa)

  return async (req, res, next) => {
    if (req.method != 'GET')
      return next()

    let localPath = path.join(root, req.originalUrl)
    let fileStat = await statNoEnoent(localPath)

    if (!fileStat || !fileStat.isFile())
      fileStat = await statNoEnoent(localPath = requestedSpa)

    if (!fileStat)
      return res.send(null, 404)

    const fileMime = mime.getType(localPath)
    if (fileMime) res.setHeader('Content-Type', fileMime)
    res.setHeader('Content-Length', fileStat.size)
    const stream = createReadStream(localPath)
    stream.once('error', next)
    stream.pipe(res)
  }
}