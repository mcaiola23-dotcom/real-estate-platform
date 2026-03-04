import test from 'node:test'
import assert from 'node:assert/strict'

import { detectSearchType } from './intent'

test('detectSearchType classifies descriptive natural language as ai', () => {
  const query = '2 bed 2 bath waterfront homes in Stamford under 900k'
  assert.equal(detectSearchType(query), 'ai')
})

test('detectSearchType classifies explicit address as address', () => {
  const query = '123 Main St'
  assert.equal(detectSearchType(query), 'address')
})

test('detectSearchType keeps short location-only query as unknown', () => {
  const query = 'Stamford'
  assert.equal(detectSearchType(query), 'unknown')
})
