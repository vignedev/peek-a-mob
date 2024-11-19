import restana, { Protocol } from 'restana'
import * as database from '../libs/database'

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
    .get('/videos/:videoId/detections/:modelName', async (req, res) => {
      const { videoId, modelName } = req.params
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

      return res.send(
        await database.detections.get(videoId, decodeURIComponent(modelName), {
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
    .get('/jobs', NotImplementedYet)            // get all jobs
    .get('/jobs/:id', NotImplementedYet)        // get specific job
    .post('/jobs', NotImplementedYet)           // create a new job
    .delete('/jobs/:id', NotImplementedYet)     // delete / cancel job
    .get('/jobs/:id/logs', NotImplementedYet)   // get job's logs (200 always, empty if not found)
    .get('/jobs/:id/result', NotImplementedYet) // get job's result (200 on OK, 404 if not ready)

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
    })

  return router
}

const getApiRouter = (router: restana.Router<Protocol.HTTP>) => {
  detectionsApi(router)
  adminApi(router)

  return router
}

export default getApiRouter