import restana, { Protocol } from 'restana'
import db, { getDetections, getVideo, getAllVideos, getEntities } from '../libs/database'

const getApiRouter = (router: restana.Router<Protocol.HTTP>) => {
  router
    .get('/entities', async (req, res) => {
      return res.send(await getEntities(), 200)
    })
    .get('/videos', async (req, res) => {
      return res.send(await getAllVideos(), 200)
    })
    .get('/videos/:id', async (req, res) => {
      const { id: videoId } = req.params

      if (!videoId) throw new Error('Missing video (?v=) query string!')
      if (Array.isArray(videoId)) throw new Error('Multiple videos (?v=) in query string!')

      return res.send(await getVideo(videoId), 200)
    })
    .get('/videos/:videoId/detections/:modelName', async (req, res) => {
      const { videoId, modelName } = req.params
      const { entities, ss: timeStart, to: timeEnd, conf: confidence } = req.query

      if (Array.isArray(timeStart) || Array.isArray(timeEnd)) throw new Error('Invalid time range!')

      return res.send(
        await getDetections(videoId, decodeURIComponent(modelName), {
          entityNames: entities ? (Array.isArray(entities) ? entities : [entities]) : [],
          confidence: parseFloat(Array.isArray(confidence) ? confidence[0] : confidence) || 0.65,
          timeStart: timeStart ? parseFloat(timeStart) : 0,
          timeEnd: timeEnd ? parseFloat(timeEnd) : Infinity
        }),
        200
      )
    })

  return router
}

export default getApiRouter