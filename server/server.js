import express from 'express'
import cors from 'cors'
import { pool } from './db/pool.js'
import * as media from './mediaRepo.js'
import * as reviews from './reviewsRepo.js'

const app = express()

// CORS before the routes. Middleware registered after a route never sees that
// route's requests.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '100kb' }))

app.get('/healthz', (request, response) => {
  response.json({ ok: true })
})

app.get('/readyz', async (request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ ok: true, db: 'up' })
  } catch (error) {
    console.error('readyz failed:', error.message)
    response.status(503).json({ ok: false, db: 'down' })
  }
})

// ---- validation ----

function validateMedia(body) {
  const errors = []
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const type = body.type
  const status = body.status || 'planned'
  const posterUrl = typeof body.posterUrl === 'string' ? body.posterUrl.trim() : ''

  if (!title) errors.push('title is required')
  if (title.length > 200) errors.push('title must be 200 characters or fewer')
  if (!['movie', 'tv'].includes(type)) errors.push('type must be "movie" or "tv"')
  if (!['planned', 'watching', 'completed', 'dropped'].includes(status)) {
    errors.push('status must be planned, watching, completed, or dropped')
  }

  return { errors, value: { title, type, status, posterUrl } }
}

function validateReview(body) {
  const errors = []
  const rating = Number(body.rating)
  const thoughts = typeof body.thoughts === 'string' ? body.thoughts.trim() : ''
  const watchedAt = body.watchedAt || null

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push('rating must be a whole number from 1 to 5')
  }
  if (thoughts.length > 2000) errors.push('thoughts must be 2000 characters or fewer')

  return { errors, value: { rating, thoughts, watchedAt } }
}

// ---- media routes ----

app.get('/api/media', async (request, response, next) => {
  try {
    const { status, type } = request.query
    response.json(await media.getAll(pool, { status, type }))
  } catch (error) {
    next(error)
  }
})

app.get('/api/media/:id', async (request, response, next) => {
  try {
    const row = await media.getById(pool, request.params.id)
    if (!row) return response.status(404).json({ error: 'Not found' })
    response.json(row)
  } catch (error) {
    next(error)
  }
})

app.post('/api/media', async (request, response, next) => {
  const { errors, value } = validateMedia(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    response.status(201).json(await media.create(pool, value))
  } catch (error) {
    next(error)
  }
})

app.put('/api/media/:id', async (request, response, next) => {
  const { errors, value } = validateMedia(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    const row = await media.update(pool, request.params.id, value)
    if (!row) return response.status(404).json({ error: 'Not found' })
    response.json(row)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/media/:id', async (request, response, next) => {
  try {
    const removed = await media.remove(pool, request.params.id)
    if (!removed) return response.status(404).json({ error: 'Not found' })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

// ---- review routes (nested under a media item) ----

app.get('/api/media/:mediaId/reviews', async (request, response, next) => {
  try {
    response.json(await reviews.getByMediaId(pool, request.params.mediaId))
  } catch (error) {
    next(error)
  }
})

app.post('/api/media/:mediaId/reviews', async (request, response, next) => {
  const { errors, value } = validateReview(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    const parent = await media.getById(pool, request.params.mediaId)
    if (!parent) return response.status(404).json({ error: 'Media not found' })
    response.status(201).json(await reviews.create(pool, request.params.mediaId, value))
  } catch (error) {
    next(error)
  }
})

app.put('/api/reviews/:id', async (request, response, next) => {
  const { errors, value } = validateReview(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    const row = await reviews.update(pool, request.params.id, value)
    if (!row) return response.status(404).json({ error: 'Not found' })
    response.json(row)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/reviews/:id', async (request, response, next) => {
  try {
    const removed = await reviews.remove(pool, request.params.id)
    if (!removed) return response.status(404).json({ error: 'Not found' })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.use((request, response) => {
  response.status(404).json({ error: 'No such route' })
})

app.use((error, request, response, next) => {
  console.error(error)
  response.status(500).json({ error: 'Something went wrong on the server' })
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
  console.log(`CORS allows: ${allowedOrigins.join(', ')}`)
})
