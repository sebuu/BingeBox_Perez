// The data-access layer for media (movies and TV shows).
//
// Every query is parameterised: values go in the array, never into the
// string. This is the single most important habit in database code, and it
// is what stops "'; DROP TABLE media; --" in a form field from being a real
// problem.

export async function getAll(pool, { status, type } = {}) {
  const conditions = []
  const params = []

  if (status) {
    params.push(status)
    conditions.push(`status = $${params.length}`)
  }
  if (type) {
    params.push(type)
    conditions.push(`type = $${params.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await pool.query(
    `SELECT * FROM media ${where} ORDER BY created_at DESC`,
    params
  )
  return result.rows
}

export async function getById(pool, id) {
  const result = await pool.query('SELECT * FROM media WHERE id = $1', [id])
  return result.rows[0] ?? null
}

export async function create(pool, { title, type, status, posterUrl }) {
  const result = await pool.query(
    `INSERT INTO media (title, type, status, poster_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, type, status ?? 'planned', posterUrl ?? '']
  )
  return result.rows[0]
}

export async function update(pool, id, { title, type, status, posterUrl }) {
  const result = await pool.query(
    `UPDATE media
     SET title = $1, type = $2, status = $3, poster_url = $4
     WHERE id = $5
     RETURNING *`,
    [title, type, status, posterUrl ?? '', id]
  )
  return result.rows[0] ?? null
}

export async function remove(pool, id) {
  // ON DELETE CASCADE on reviews.media_id means this also removes that
  // title's reviews -- no orphaned rows left behind.
  const result = await pool.query(
    'DELETE FROM media WHERE id = $1 RETURNING id',
    [id]
  )
  return result.rowCount > 0
}
