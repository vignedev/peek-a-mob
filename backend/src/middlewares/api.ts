import restana, { Protocol } from 'restana'

const getApiRouter = (router: restana.Router<Protocol.HTTP>) => {
  router
    .get('/videos', async (req, res) => {
      throw new Error('Not implemtented')
    })
    .get('/videos/:id', async (req, res) => {
      throw new Error('Not implemtented')
    })
    .get('/videos/:id/detections', async (req, res) => {
      throw new Error('Not implemtented')
    })

  return router
}

export default getApiRouter