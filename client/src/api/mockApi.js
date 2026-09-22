// The simulated backend.
//
// Same function names, same return types, same shape of failure as
// httpApi.js, so your components cannot tell the difference. Data lives in
// the visitor's own browser and goes no further.

import seed from './seed.json'

const KEY = 'final-project:bingebox'

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

function read() {
  const stored = localStorage.getItem(KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      localStorage.removeItem(KEY)
    }
  }
  localStorage.setItem(KEY, JSON.stringify(seed))
  return structuredClone(seed)
}

function write(store) {
  localStorage.setItem(KEY, JSON.stringify(store))
  return store
}

function uid(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`
}

// ---- media ----

export async function listMedia({ status, type } = {}) {
  await delay()
  const store = read()
  return store.media
    .filter((m) => (!status || m.status === status) && (!type || m.type === type))
    .sort((a, b) => Number(b.id) - Number(a.id))
}

export async function getMedia(id) {
  await delay()
  const found = read().media.find((m) => String(m.id) === String(id))
  if (!found) throw new Error('Not found')
  return found
}

export async function createMedia(input) {
  await delay()
  const store = read()
  const created = {
    id: uid('m'),
    title: input.title,
    type: input.type,
    status: input.status || 'planned',
    posterUrl: input.posterUrl || '',
  }
  store.media.push(created)
  write(store)
  return created
}

export async function updateMedia(id, input) {
  await delay()
  const store = read()
  const index = store.media.findIndex((m) => String(m.id) === String(id))
  if (index === -1) throw new Error('Not found')
  store.media[index] = { ...store.media[index], ...input }
  write(store)
  return store.media[index]
}

export async function deleteMedia(id) {
  await delay()
  const store = read()
  store.media = store.media.filter((m) => String(m.id) !== String(id))
  store.reviews = store.reviews.filter((r) => String(r.mediaId) !== String(id))
  write(store)
}

// ---- reviews (a media item can have many, for rewatches) ----

export async function listReviews(mediaId) {
  await delay()
  return read()
    .reviews.filter((r) => String(r.mediaId) === String(mediaId))
    .sort((a, b) => b.watchedAt.localeCompare(a.watchedAt))
}

export async function createReview(mediaId, input) {
  await delay()
  const store = read()
  const created = {
    id: uid('r'),
    mediaId: String(mediaId),
    rating: input.rating,
    thoughts: input.thoughts || '',
    watchedAt: input.watchedAt || new Date().toISOString().slice(0, 10),
  }
  store.reviews.push(created)
  write(store)
  return created
}

export async function updateReview(id, input) {
  await delay()
  const store = read()
  const index = store.reviews.findIndex((r) => String(r.id) === String(id))
  if (index === -1) throw new Error('Not found')
  store.reviews[index] = { ...store.reviews[index], ...input }
  write(store)
  return store.reviews[index]
}

export async function deleteReview(id) {
  await delay()
  const store = read()
  store.reviews = store.reviews.filter((r) => String(r.id) !== String(id))
  write(store)
}
