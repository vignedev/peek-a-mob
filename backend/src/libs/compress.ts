import { buffer } from "node:stream/consumers";
import { Protocol, Request, Response } from "restana";
import { createGzip } from "zlib";

export const send = async (data: object, code: number, req: Request<Protocol.HTTP>, res: Response<Protocol.HTTP>) => {
  const header = req.headers['accept-encoding']

  const accepted = (Array.isArray(header) ? header[0] : (header ?? '')).split(',').map(x => x.trim()).filter(x => !!x)
  if (accepted.length == 0)
    return res.send(data, code)

  for (const method of accepted) {
    if (method == 'gzip') {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Encoding', 'gzip')
      res.setHeader('Vary', 'Content-Encoding')

      const gzip = createGzip({ level: 6 })
      gzip.write(JSON.stringify(data), () => gzip.end())
      return gzip.pipe(res)
    }
  }

  return res.send(data, code)
}