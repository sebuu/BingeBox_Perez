// The data-access layer for reviews.
//
// A media item can have several reviews over time (rewatches), so this is a
// one-to-many table: getByMediaId returns every review for a title, newest
// watch first.

export async function getByMediaId(pool, mediaId) {
  const result = await pool.query(
    'SELECT * FROM reviews WHERE media_id = $1 ORDER BY watched_at DESC',
    [mediaId]
  )
  return result.rows
}

export async function getById(pool, id) {
  const result = await pool.query('SELECT * FROM reviews WHERE id = $1', [id])
  return result.rows[0] ?? null
}

export async function create(pool, mediaId, { rating, thoughts, watchedAt }) {
  const result = await pool.query(
    `INSERT INTO reviews (media_id, rating, thoughts, watched_at)
     VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE))
     RETURNING *`,
    [mediaId, rating, thoughts ?? '', watchedAt ?? null]
  )
  return result.rows[0]
}

export async function update(pool, id, { rating, thoughts, watchedAt }) {
  const result = await pool.query(
    `UPDATE reviews
     SET rating = $1, thoughts = $2, watched_at = $3
     WHERE id = $4
     RETURNING *`,
    [rating, thoughts ?? '', watchedAt, id]
  )
  return result.rows[0] ?? null
}

export async function remove(pool, id) {
  const result = await pool.query(
    'DELETE FROM reviews WHERE id = $1 RETURNING id',
    [id]
  )
  return result.rowCount > 0
}
