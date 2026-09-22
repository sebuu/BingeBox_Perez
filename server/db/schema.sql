-- The complete shape of the database. Safe to run against an empty database,
-- and safe to run twice.
--
-- This file is committed on purpose. Your schema is a fact about your
-- application, not a runtime concern: it should be readable by opening a file
-- rather than by connecting to a server. It is also what lets you move to a
-- hosted database in one command.

CREATE TABLE IF NOT EXISTS media (
  id         SERIAL PRIMARY KEY,
  title      TEXT        NOT NULL,
  type       TEXT        NOT NULL CHECK (type IN ('movie', 'tv')),
  status     TEXT        NOT NULL DEFAULT 'planned'
                          CHECK (status IN ('planned', 'watching', 'completed', 'dropped')),
  poster_url TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A media item can be rewatched, so this is one-to-many: several reviews may
-- point at the same media row. ON DELETE CASCADE means removing a title also
-- removes its reviews, so you never end up with orphaned rows pointing at
-- nothing.
CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  media_id   INTEGER     NOT NULL REFERENCES media (id) ON DELETE CASCADE,
  rating     INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  thoughts   TEXT        NOT NULL DEFAULT '',
  watched_at DATE        NOT NULL DEFAULT CURRENT_DATE
);

-- The watchlist page filters by status/type constantly.
CREATE INDEX IF NOT EXISTS media_status_idx ON media (status);
CREATE INDEX IF NOT EXISTS media_type_idx ON media (type);

-- The detail page always wants a title's reviews newest first.
CREATE INDEX IF NOT EXISTS reviews_media_id_idx ON reviews (media_id);
CREATE INDEX IF NOT EXISTS reviews_watched_at_idx ON reviews (watched_at DESC);
