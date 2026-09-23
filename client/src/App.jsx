import { useEffect, useState } from 'react'
import {
  listMedia,
  createMedia,
  deleteMedia,
  listReviews,
  createReview,
  deleteReview,
} from './api'
import DemoNotice from './components/DemoNotice.jsx'

// Four states, not two: loading, ready, empty and error each look different,
// because "nothing here yet" and "we could not find out" are different
// situations and must not read the same way to the person using this.

const EMPTY_MEDIA_FORM = { title: '', type: 'movie', status: 'planned', posterUrl: '' }
const EMPTY_REVIEW_FORM = { rating: 5, thoughts: '', watchedAt: '' }

const STATUS_LABELS = {
  planned: 'Planned',
  watching: 'Watching',
  completed: 'Completed',
  dropped: 'Dropped',
}

function Stars({ rating }) {
  return (
    <span className="review-stars" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}
      {'☆'.repeat(5 - rating)}
    </span>
  )
}

// The average of a title's reviews, shown as the ticket's stamped rating.
// Titles with no reviews yet show a dash instead of a misleading 0.
function averageRating(mediaReviews) {
  if (!mediaReviews || mediaReviews.length === 0) return null
  const total = mediaReviews.reduce((sum, review) => sum + review.rating, 0)
  return Math.round((total / mediaReviews.length) * 10) / 10
}

export default function App() {
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)
  const [slow, setSlow] = useState(false)

  // Filters, applied server-side (or in the mock's in-memory filter).
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Add-media form
  const [form, setForm] = useState(EMPTY_MEDIA_FORM)
  const [saving, setSaving] = useState(false)

  // Accordion: which media id is expanded, plus that title's reviews.
  const [expandedId, setExpandedId] = useState(null)
  const [reviews, setReviews] = useState([])
  const [reviewsStatus, setReviewsStatus] = useState('ready') // loading | ready | error
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW_FORM)
  const [savingReview, setSavingReview] = useState(false)

  async function load() {
    setStatus('loading')
    setError(null)
    const timer = setTimeout(() => setSlow(true), 3000)

    try {
      setRows(await listMedia({ status: statusFilter, type: typeFilter }))
      setStatus('ready')
    } catch (caught) {
      setError(caught)
      setStatus('error')
    } finally {
      clearTimeout(timer)
      setSlow(false)
    }
  }

  useEffect(() => {
    load()
    // Collapse any open card when the filters change, since it may no
    // longer be in the list.
    setExpandedId(null)
  }, [statusFilter, typeFilter])

  async function handleAddMedia(event) {
    event.preventDefault()
    if (!form.title.trim()) return

    setSaving(true)
    try {
      const created = await createMedia({
        title: form.title.trim(),
        type: form.type,
        status: form.status,
        posterUrl: form.posterUrl.trim(),
      })
      // Only show it immediately if it matches the current filters.
      const matches =
        (!statusFilter || created.status === statusFilter) &&
        (!typeFilter || created.type === typeFilter)
      if (matches) setRows([created, ...rows])
      setForm(EMPTY_MEDIA_FORM)
    } catch (caught) {
      setError(caught)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteMedia(id) {
    const previous = rows
    setRows(rows.filter((row) => row.id !== id))
    if (expandedId === id) setExpandedId(null)
    try {
      await deleteMedia(id)
    } catch (caught) {
      setRows(previous)
      setError(caught)
    }
  }

  async function toggleExpand(id) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    setReviewForm(EMPTY_REVIEW_FORM)
    setReviewsStatus('loading')
    try {
      setReviews(await listReviews(id))
      setReviewsStatus('ready')
    } catch (caught) {
      setError(caught)
      setReviewsStatus('error')
    }
  }

  async function handleAddReview(event) {
    event.preventDefault()
    setSavingReview(true)
    try {
      const created = await createReview(expandedId, {
        rating: Number(reviewForm.rating),
        thoughts: reviewForm.thoughts.trim(),
        watchedAt: reviewForm.watchedAt || undefined,
      })
      setReviews([created, ...reviews])
      setReviewForm(EMPTY_REVIEW_FORM)
    } catch (caught) {
      setError(caught)
    } finally {
      setSavingReview(false)
    }
  }

  async function handleDeleteReview(id) {
    const previous = reviews
    setReviews(reviews.filter((review) => review.id !== id))
    try {
      await deleteReview(id)
    } catch (caught) {
      setReviews(previous)
      setError(caught)
    }
  }

  return (
    <div className="page">
      <header>
        <h1>BingeBox</h1>
        <p className="lede">
          Track what you watch, rate it, and keep your thoughts on rewatches.
        </p>
      </header>

      <DemoNotice />

      {error && (
        <p className="error" role="alert">
          {error.message} <button onClick={load}>Try again</button>
        </p>
      )}

      <div className="card">
        <h2>Filter your list</h2>
        <div className="filters-row">
          <div>
            <label htmlFor="statusFilter">Status</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="typeFilter">Type</label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="">Movies and TV</option>
              <option value="movie">Movies only</option>
              <option value="tv">TV only</option>
            </select>
          </div>
        </div>
      </div>

      <form onSubmit={handleAddMedia} className="card">
        <h2>Add a title</h2>

        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          maxLength={200}
          required
        />

        <label htmlFor="type">Type</label>
        <select
          id="type"
          value={form.type}
          onChange={(event) => setForm({ ...form, type: event.target.value })}
        >
          <option value="movie">Movie</option>
          <option value="tv">TV show</option>
        </select>

        <label htmlFor="mediaStatus">Status</label>
        <select
          id="mediaStatus"
          value={form.status}
          onChange={(event) => setForm({ ...form, status: event.target.value })}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <label htmlFor="posterUrl">Poster URL (optional)</label>
        <input
          id="posterUrl"
          value={form.posterUrl}
          onChange={(event) => setForm({ ...form, posterUrl: event.target.value })}
          placeholder="https://..."
        />

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Add title'}
        </button>
      </form>

      {status === 'loading' && (
        <p className="muted">
          Loading{slow ? '. The server may be waking up, which can take up to a minute.' : '...'}
        </p>
      )}

      {status === 'ready' && rows.length === 0 && (
        <p className="muted">Nothing matches these filters yet. Add a title above.</p>
      )}

      {status === 'ready' && rows.length > 0 && (
        <ul className="list">
          {rows.map((row) => {
            const avg = expandedId === row.id ? averageRating(reviews) : null
            return (
            <li key={row.id} className="card ticket">
              {row.posterUrl ? (
                <img className="ticket-poster" src={row.posterUrl} alt="" />
              ) : (
                <div className="ticket-poster-placeholder">
                  {row.type === 'tv' ? 'TV' : '🎬'}
                </div>
              )}
              <div className="ticket-perforation" aria-hidden="true"></div>

              <div className="ticket-body">
                <div className="ticket-top">
                  <h3>{row.title}</h3>
                  {avg != null && <span className="stamp">{avg}★</span>}
                </div>
                <div className="ticket-meta">
                  {row.type === 'tv' ? 'TV' : 'Movie'}{' '}
                  <span className="status-tag">{STATUS_LABELS[row.status]}</span>
                </div>

                <div className="ticket-actions">
                  <button onClick={() => toggleExpand(row.id)}>
                    {expandedId === row.id ? 'Hide reviews' : 'Reviews'}
                  </button>
                  <button onClick={() => handleDeleteMedia(row.id)}>Delete</button>
                </div>
              </div>

              {expandedId === row.id && (
                <div className="reviews-panel" style={{ gridColumn: '1 / -1' }}>
                  <h4>Your reviews</h4>

                  {reviewsStatus === 'loading' && <p className="muted">Loading reviews...</p>}

                  {reviewsStatus === 'ready' && reviews.length === 0 && (
                    <p className="muted">No reviews yet. Add one below, including on a rewatch.</p>
                  )}

                  {reviewsStatus === 'ready' && reviews.length > 0 && (
                    <ul className="list">
                      {reviews.map((review) => (
                        <li key={review.id} className="review-entry">
                          <Stars rating={review.rating} />{' '}
                          <time dateTime={review.watchedAt}>
                            {new Date(review.watchedAt).toLocaleDateString()}
                          </time>
                          {review.thoughts && <p>{review.thoughts}</p>}
                          <button onClick={() => handleDeleteReview(review.id)}>Delete</button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form onSubmit={handleAddReview}>
                    <label htmlFor="rating">Rating, 1 to 5</label>
                    <input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      value={reviewForm.rating}
                      onChange={(event) =>
                        setReviewForm({ ...reviewForm, rating: event.target.value })
                      }
                      required
                    />

                    <label htmlFor="thoughts">Thoughts</label>
                    <textarea
                      id="thoughts"
                      value={reviewForm.thoughts}
                      onChange={(event) =>
                        setReviewForm({ ...reviewForm, thoughts: event.target.value })
                      }
                      maxLength={2000}
                      rows={3}
                    />

                    <label htmlFor="watchedAt">Date watched (optional, defaults to today)</label>
                    <input
                      id="watchedAt"
                      type="date"
                      value={reviewForm.watchedAt}
                      onChange={(event) =>
                        setReviewForm({ ...reviewForm, watchedAt: event.target.value })
                      }
                    />

                    <button type="submit" disabled={savingReview}>
                      {savingReview ? 'Saving...' : 'Add review'}
                    </button>
                  </form>
                </div>
              )}
            </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
