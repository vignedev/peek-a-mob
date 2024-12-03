import restana, { Protocol } from 'restana'
import * as database from '../libs/database'
import * as log from '../libs/log'
import * as env from '../libs/env'
import * as compress from '../libs/compress'
import { createReadStream, createWriteStream } from 'fs'
import { copyFile, mkdir, mkdtemp, rm, rmdir, stat } from 'fs/promises'
import { pipeline } from 'stream/promises'
import path from 'path'
import runner from '../libs/runner'
import { tmpdir } from 'os'
import { requireJSON } from './parser'

const detectionsApi = (router: restana.Router<Protocol.HTTP>) => {
  return router
    .get('/entities', async (_req, res) => {
      return res.send(await database.entities.getAll(), 200)
    })
    .get('/videos', async (req, res) => {
      const { e: entities, model } = req.query
      const entityArray = entities ? (Array.isArray(entities) ? entities : [entities]) : []
      return res.send(await database.videos.getAll(entityArray, (+(Array.isArray(model) ? model[0] : model)) || undefined), 200)
    })
    .get('/videos/:youtubeId', async (req, res) => {
      const { youtubeId } = req.params

      const video = await database.videos.get(youtubeId)
      if (!video)
        return res.send({ error: 'No video of such ID was found.' }, 404)

      return res.send(video)
    })
    .get('/videos/:youtubeId/detections/:modelId', async (req, res) => {
      const { youtubeId, modelId } = req.params
      const { e: entities, ss, to, conf } = req.query

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

      return await compress.send( // TODO: handle invalid modelId
        await database.detections.get(youtubeId, parseInt(modelId, 10), {
          entityNames: entities ? (Array.isArray(entities) ? entities : [entities]) : [],
          confidence: confidence,
          timeStart: timeStart,
          timeEnd: timeEnd
        }),
        200,
        req, res
      )
    })
    .get('/videos/:youtubeId/entities', async (req, res) => {
      const { youtubeId } = req.params
      return res.send(await database.videos.getEntities(youtubeId, -1))
    })
    .get('/videos/:youtubeId/entities/:modelId', async (req, res) => {
      const { youtubeId, modelId } = req.params
      return res.send(await database.videos.getEntities(youtubeId, +modelId))
    })
}

const adminApi = (router: restana.Router<Protocol.HTTP>) => {
  router
    .get('/jobs', (_req, res) => {              // get all jobs 
      return res.send(runner.getAll().map(({ logs, result, ...rest }) => ({ ...rest, exportable: !!result })))
    })
    .get('/jobs/:id', (req, res) => {           // get specific job
      const { id: jobId } = req.params
      const id = parseInt(jobId, 10)

      if (isNaN(id))
        return res.send({ error: 'Invalid job ID' }, 400)

      const job = runner.get(id)
      if (!job)
        return res.send({ error: 'Job not found' }, 404)

      const { logs, result, ...rest } = job
      return res.send({ ...rest, exportable: !!result })
    })
    .post('/jobs', requireJSON(), async (req, res) => {        // create a new job
      const data = req.body as { modelId: number, youtubeId: string }

      if (!data || !data.modelId || !data.youtubeId)
        return res.send({ error: 'Invalid JSON request (missing data)' }, 400)

      if (await database.detections.exists(data.youtubeId, data.modelId))
        return res.send({ error: 'Given video was already analyzed by that model.' }, 403)

      res.send(runner.addJob(`https://youtube.com/watch?v=${data.youtubeId}`, data.modelId))
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
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.statusCode = 200
      for (const buffer of job.logs)
        await write(buffer)

      res.end()
    })
    .get('/jobs/:id/export', async (req, res) => { // export the csv if possible
      const { id: jobId } = req.params
      const id = parseInt(jobId, 10)

      if (isNaN(id))
        return res.send({ error: 'Invalid job ID' }, 400)

      const job = runner.get(id)
      if (!job)
        return res.send({ error: 'Job not found' }, 404)

      if (job.result) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        createReadStream(job.result).pipe(res)
        return
      }

      return res.send({ error: 'Job has no exportable data. Is it finished or importing...?' }, 400)
    })
    .delete('/jobs/:id', async (req, res) => {  // delete / cancel job
      const { id: jobId } = req.params
      const id = parseInt(jobId, 10)

      if (isNaN(id))
        return res.send({ error: 'Invalid job ID' }, 400)

      const job = runner.get(id)
      if (!job)
        return res.send({ error: 'Job not found' }, 404)

      if (job.status != 'active')
        return res.send({ error: 'Can\'t delete non-active job' }, 400)

      if (runner.kill()) return res.send({}, 200)
      else return res.send({ error: 'Unknown error: runner.kill() returned false' }, 500)
    })

  router
    .get('/models', async (_req, res) => {      // get all available models
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
    .get('/models/:id/download', async (req, res) => { // download the model
      const { id } = req.params
      const modelId = parseInt(id, 10)

      if (isNaN(modelId))
        return res.send({ error: 'ID is not numeric.' }, 400)

      const model = await database.models.get(modelId)
      if (!model)
        return res.send({ error: 'Model by that ID not found.' }, 404)

      const { mtime, size } = await stat(model.modelPath)
      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader('Content-Length', size.toString())
      res.setHeader('Last-Modified', mtime.toUTCString())
      createReadStream(model.modelPath).pipe(res)
    })
    .post('/models/:id', requireJSON(), async (req, res) => {   // rename/set as primary the model's name
      const { id } = req.params
      const modelId = parseInt(id, 10)

      if (isNaN(modelId))
        return res.send({ error: 'ID is not numeric.' }, 400)

      const model = await database.models.get(modelId)
      if (!model)
        return res.send({ error: 'Model by that ID not found.' }, 404)

      const data = req.body as { modelName?: string, modelIsPrimary?: boolean }
      if (!data.modelIsPrimary && !data.modelName)
        return res.send({ error: 'Empty changing request?' }, 400)

      if (data.modelName)
        await database.models.rename(modelId, data.modelName)

      if (data.modelIsPrimary)
        await database.models.setAsPrimary(modelId)

      return res.send(await database.models.get(modelId), 200)
    })
    .post('/models', async (req, res) => {      // upload a new model (accept *.pt files, require name)
      const length = parseInt(req.headers['content-length']!, 10)
      if (isNaN(length) || length >= 50_000_000)
        return res.send('Invalid Content-Length or too big of a file (limit of 50MB)', 400)

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
      // await rename(tmpFilename, realFilename)           // move it from temp to real (can't due to EXDEV)
      await copyFile(tmpFilename, realFilename)            // copy it from temp to real
      await rm(tmpFilename)                                // remove the original
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

  router
    .get('/detections', async (req, res) => {
      return res.send(
        (await database.detections.getAll()).reduce((acc, { modelId, videoTitle, youtubeId }) => {
          if (!acc[youtubeId]) acc[youtubeId] = { videoTitle, modelIds: [] }
          acc[youtubeId].modelIds.push(modelId!)
          return acc
        }, {} as Record<string, { videoTitle: string, modelIds: number[] }>)
      )
    })
    .delete('/videos/:youtubeId/detections/:modelId', async (req, res) => {
      const { youtubeId, modelId } = req.params
      return res.send(await database.detections.delete(youtubeId, +modelId))
    })

  return router
}

const getApiRouter = (router: restana.Router<Protocol.HTTP>) => {
  detectionsApi(router)
  adminApi(router)

  return router
}

export default getApiRouter