-- Sample data for development.
--
-- This starts with TRUNCATE. That is correct on your laptop and catastrophic
-- against the database your live demo depends on. Check which DATABASE_URL is
-- loaded before you run it.

TRUNCATE TABLE reviews RESTART IDENTITY CASCADE;
TRUNCATE TABLE media RESTART IDENTITY CASCADE;

INSERT INTO media (title, type, status, poster_url) VALUES
  ('The Bear', 'tv', 'watching', 'https://via.placeholder.com/200x300?text=The+Bear'),
  ('Dune: Part Two', 'movie', 'completed', 'https://via.placeholder.com/200x300?text=Dune+2'),
  ('Severance', 'tv', 'completed', 'https://via.placeholder.com/200x300?text=Severance'),
  ('Poor Things', 'movie', 'planned', 'https://via.placeholder.com/200x300?text=Poor+Things'),
  ('The Idea of You', 'movie', 'dropped', 'https://via.placeholder.com/200x300?text=The+Idea+of+You');

-- media_id values below assume the inserts above ran in order, starting at 1
-- (RESTART IDENTITY guarantees that on a fresh seed).
INSERT INTO reviews (media_id, rating, thoughts, watched_at) VALUES
  (2, 5, 'Villeneuve sticks the landing. Best sequel in years.', CURRENT_DATE - INTERVAL '20 days'),
  (3, 4, 'First watch: the twist episode wrecked me.', CURRENT_DATE - INTERVAL '60 days'),
  (3, 5, 'Rewatch after season 2 dropped -- holds up even better knowing where it goes.', CURRENT_DATE - INTERVAL '3 days');
