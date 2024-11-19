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

const getApiRouter = (router: restana.Router<Protocol.HTTP>) => {
  detectionsApi(router)

  return router
}

export default getApiRouter