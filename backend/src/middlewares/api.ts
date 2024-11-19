import restana, { Protocol } from 'restana'
import * as database from '../libs/database'
import * as log from '../libs/log'
import * as env from '../libs/env'
import { createWriteStream } from 'fs'
import { mkdir, mkdtemp, rename, rm, rmdir } from 'fs/promises'
import { pipeline } from 'stream/promises'
import path from 'path'
import runner from '../libs/runner'
import { buffer } from 'node:stream/consumers'
import { tmpdir } from 'os'

const detectionsApi = (router: restana.Router<Protocol.HTTP>) => {
  return router
    .get('/entities', async (_req, res) => {
      return res.send(await database.entities.getAll(), 200)
    })
    .get('/videos', async (_req, res) => {
      return res.send(await database.videos.getAll(), 200)
    })
    .get('/videos/:id', async (req, res) => {
      const { id: videoId } = req.params

      const video = await database.videos.get(videoId)
      if (!video)
        return res.send({ error: 'No video of such ID was found.' }, 404)

      return res.send(video)
    })
    .get('/videos/:videoId/detections/:modelId', async (req, res) => {
      const { videoId, modelId } = req.params
      const { entities, ss, to, conf } = req.query

      if (Array.isArray(ss) || Array.isArray(to))
        return res.send({ error: 'Invalid time range (multiple ranges?)' }, 400)

      const [timeStart, timeEnd] = [ss || '0', to || 'Infinity'].map(x => parseFloat(x))
      if (isNaN(timeStart) || isNaN(timeEnd))
        return res.send({ error: '?ss= or ?to= value could not be parsed!' }, 400)

      if (timeStart > timeEnd)
        return res.send({ error: 'Invalid time range (start > end)' }, 400)

      if (Array.isArray(conf))
        return res.send({ error: 'Confidence cannot be an array!' }, 400)

      const confidence = parseFloat(conf || '0.65')
      if (isNaN(confidence))
        return res.send({ error: 'Confidence value could not be parsed' }, 400)

      return res.send( // TODO: handle invalid modelId
        await database.detections.get(videoId, parseInt(modelId, 10), {
          entityNames: entities ? (Array.isArray(entities) ? entities : [entities]) : [],
          confidence: confidence,
          timeStart: timeStart,
          timeEnd: timeEnd
        }),
        200
      )
    })
}

const adminApi = (router: restana.Router<Protocol.HTTP>) => {
  const NotImplementedYet = (
    _req: restana.Request<Protocol.HTTP>,
    res: restana.Response<Protocol.HTTP>
  ) => res.send({ error: 'Not Implemented... yet?' }, 501)

  router
    .get('/jobs', (_req, res) => {              // get all jobs 
      return res.send(runner.getAll().map(({ logs, ...rest }) => rest))
    })
    .get('/jobs/:id', (req, res) => {           // get specific job
      const { id: jobId } = req.params
      const id = parseInt(jobId, 10)

      if (isNaN(id))
        return res.send({ error: 'Invalid job ID' }, 400)

      const job = runner.get(id)
      if (!job)
        return res.send({ error: 'Job not found' }, 404)

      const { logs, ...rest } = job
      return res.send(rest)
    })
    .post('/jobs', async (req, res) => {        // create a new job
      const rawData = await buffer(req)
      let data: { modelId: number, videoUrl: string } | null = null
      try { data = JSON.parse(rawData.toString()) }
      catch (err) { return res.send({ error: 'Invalid JSON request' }, 400) }

      if (!data || !data.modelId || !data.videoUrl)
        return res.send({ error: 'Invalid JSON request (missing data)' }, 400)

      res.send(runner.addJob(data.videoUrl, data.modelId))
    })
    .get('/jobs/:id/logs', async (req, res) => {// get job's logs (200 always, empty if not found)
      const { id: jobId } = req.params
      const id = parseInt(jobId, 10)

      if (isNaN(id))
        return res.send({ error: 'Invalid job ID' }, 400)

      const job = runner.get(id)
      if (!job)
        return res.send({ error: 'Job not found' }, 404)

      const write = (buffer: Buffer) => new Promise((resolve) => res.write(buffer, resolve))
      res.statusCode = 200
      for (const buffer of job.logs)
        await write(buffer)

      res.end()
    })
    .delete('/jobs/:id', NotImplementedYet)     // delete / cancel job

  router
    .get('/models', async (_req, res) => {       // get all available models
      res.send(await database.models.getAll())
    })
    .get('/models/:id', async (req, res) => {   // get a specific model
      const { id } = req.params
      const modelId = parseInt(id, 10)

      if (isNaN(modelId))
        return res.send({ error: 'ID is not numeric.' }, 400)

      const model = await database.models.get(modelId)
      if (!model)
        return res.send({ error: 'Model by that ID not found.' }, 404)

      res.send(model, 200)
    })
    .post('/models', async (req, res) => {      // upload a new model (accept *.pt files, require name)
      const length = parseInt(req.headers['content-length']!, 10)
      if (isNaN(length) || length >= 10_000_000)
        return res.send('Invalid Content-Length or too big of a file (limit of 10MB)', 400)

      const modelName = req.headers['PAM-Model-Name'.toLowerCase()]
      if (!modelName)
        return res.send('Missing PAM-Model-Name header', 400)
      if (Array.isArray(modelName))
        return res.send('PAM-Model-Name specified too many times... Wait, that can happen?', 400)

      const tmpFolder = await mkdtemp(path.join(tmpdir(), 'pam-'))
      const tmpFilename = path.resolve(path.join(tmpFolder, 'model.pt'))

      const realFolder = path.resolve(env.str('MODEL_ROOT_PATH'))
      const realFilename = path.join(realFolder, `model_${Date.now()}_${Math.floor(Math.random() * 65535).toString(16).padStart(4, '0').toUpperCase()}.pt`)

      await mkdir(realFolder, { recursive: true })         // create the "real destination folder"
      await pipeline(req, createWriteStream(tmpFilename))  // save it to the temp (in case it fails, we dont pollute our real folder)
      await rename(tmpFilename, realFilename)              // move it from temp to real
      await rmdir(tmpFolder)                               // remove the temporary folder

      try {
        const model = await database.models.new(realFilename, modelName)
        log.info(`Imported new model (path='${realFilename}')`, model)
        return res.send(model)
      } catch (err) {
        log.error('Failed to insert the new model into the database!')
        log.error(err)
        await rm(realFilename)
        return res.send({ error: 'Failed to insert the thingamajig', data: err }, 500)
      }
    })

  return router
}

const getApiRouter = (router: restana.Router<Protocol.HTTP>) => {
  detectionsApi(router)
  adminApi(router)

  return router
}

export default getApiRouter