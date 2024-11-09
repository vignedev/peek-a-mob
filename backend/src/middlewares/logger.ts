import { ErrorHandler, Protocol, Request, RequestHandler } from "restana";
import { info, error } from "../libs/log.js";
import { AddressInfo } from "net";
import colors from "ansi-colors";

const { gray, yellow } = colors

export const get_trace_str = (req: Request<Protocol.HTTP>) => {
  const source = req.socket.address() as AddressInfo
  return `${source.address}:${source.port} ${gray('|')} ${yellow(req.method!)} ${decodeURI(req.originalUrl)}`
}

export const logger: RequestHandler<Protocol.HTTP> = (req, res, next) => {
  info(get_trace_str(req))
  return next()
}
export const errorLogger: ErrorHandler<Protocol.HTTP> = (err, req, res) => {
  error(get_trace_str(req), gray('restana'), '\n', err)
  res.send(err, 500)
}