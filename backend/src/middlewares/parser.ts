import { buffer } from "node:stream/consumers"
import { Protocol, RequestHandler } from "restana"

export const requireJSON = (limit?: number): RequestHandler<Protocol.HTTP> => {
  return async (req, res, next) => {
    if (req.method !== 'POST')
      return res.send({ error: 'Invalid method, needs a POST ' }, 405)

    if (!req.headers["content-type"]?.startsWith('application/json'))
      return res.send({ error: 'Invalid Content-Type, expecting application/json' }, 400)

    const length = parseInt(req.headers["content-length"]!, 10)
    if (isNaN(length) || length == 0)
      return res.send({ error: 'Invalid Content-Length' }, 400)

    if (typeof limit !== 'undefined' && length > limit)
      return res.send({ error: 'Content-Length exceeds limit' }, 400)

    const data = await buffer(req) // TODO: does http/node limit the stream size to content-length?
    try {
      const parsed = JSON.parse(data.toString())
      if (typeof parsed === 'undefined')
        return res.send({ error: 'Empty JSON body' }, 400)

      req.body = parsed
      return next()
    } catch (err) {
      return res.send({ error: 'Unparseable JSON' }, 400)
    }
  }
}