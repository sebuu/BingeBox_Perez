// The real client. Every function here talks to YOUR Express API.

const BASE = import.meta.env.VITE_API_BASE_URL || ''

async function request(path, options) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {
      // The body was not JSON. The status line is all we have.
    }
    throw new Error(message)
  }

  return response.status === 204 ? null : response.json()
}

function toQuery(params) {
  const entries = Object.entries(params).filter(([, v]) => v)
  if (entries.length === 0) return ''
  return `?${new URLSearchParams(entries).toString()}`
}

// ---- media ----

export const listMedia = ({ status, type } = {}) =>
  request(`/api/media${toQuery({ status, type })}`)

export const getMedia = (id) => request(`/api/media/${id}`)

export const createMedia = (input) =>
  request('/api/media', { method: 'POST', body: JSON.stringify(input) })

export const updateMedia = (id, input) =>
  request(`/api/media/${id}`, { method: 'PUT', body: JSON.stringify(input) })

export const deleteMedia = (id) =>
  request(`/api/media/${id}`, { method: 'DELETE' })

// ---- reviews ----

export const listReviews = (mediaId) =>
  request(`/api/media/${mediaId}/reviews`)

export const createReview = (mediaId, input) =>
  request(`/api/media/${mediaId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(input),
  })

export const updateReview = (id, input) =>
  request(`/api/reviews/${id}`, { method: 'PUT', body: JSON.stringify(input) })

export const deleteReview = (id) =>
  request(`/api/reviews/${id}`, { method: 'DELETE' })
