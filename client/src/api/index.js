// The only file your components import from.
//
// Swapping the simulated backend for your real API is one environment
// variable, set at BUILD time. Nothing in src/components or src/pages
// changes.
//
//   VITE_USE_MOCK_API=false  -> your Express API at VITE_API_BASE_URL
//   anything else, INCLUDING UNSET -> the browser-only fake

import * as mockApi from './mockApi.js'
import * as httpApi from './httpApi.js'

export const USING_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

const implementation = USING_MOCK_API ? mockApi : httpApi

export const {
  listMedia,
  getMedia,
  createMedia,
  updateMedia,
  deleteMedia,
  listReviews,
  createReview,
  updateReview,
  deleteReview,
} = implementation
