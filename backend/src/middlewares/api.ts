import restana, { Protocol } from 'restana'
import db, { getDetections, getVideo, getAllVideos } from '../libs/database'

const getApiRouter = (router: restana.Router<Protocol.HTTP>) => {
  router
    .get('/videos', async (req, res) => {
      return res.send(await getAllVideos(), 200)
    })
    .get('/videos/:id', async (req, res) => {
      const { v: videoId } = req.query

      if (!videoId) throw new Error('Missing video (?v=) query string!')
      if (Array.isArray(videoId)) throw new Error('Multiple videos (?v=) in query string!')

      return res.send(await getVideo(videoId), 200)
    })
    .get('/videos/:id/detections', async (req, res) => {
      const { entities, modelId, v: videoId, ss: timeStart, to: timeEnd } = req.query

      if (!videoId) throw new Error('Missing video (?v=) query string!')
      if (Array.isArray(videoId)) throw new Error('Multiple videos (?v=) in query string!')
      if (Array.isArray(timeStart) || Array.isArray(timeEnd)) throw new Error('Invalid time range!')
      if (!modelId) throw new Error('Missing modelId')
      if (Array.isArray(modelId)) throw new Error('Multiple modelIds')

      return res.send(
        await getDetections(videoId, modelId, {
          entityNames: Array.isArray(entities) ? entities : [entities],
          confidence: 0.65,
          timeStart: timeStart ? parseFloat(timeStart) : undefined,
          timeEnd: timeEnd ? parseFloat(timeEnd) : undefined
        }),
        200
      )
    })

  return router
}

export default getApiRouter