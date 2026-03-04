import test from 'node:test'
import assert from 'node:assert/strict'

import {
  clearNeighborhoodSelectionIfNoCities,
  createDefaultPropertyFilters,
  pruneNeighborhoodSelections,
} from './filter-utils'

test('createDefaultPropertyFilters returns expected defaults', () => {
  const defaults = createDefaultPropertyFilters()

  assert.deepEqual(defaults.cities, [])
  assert.deepEqual(defaults.neighborhoods, [])
  assert.deepEqual(defaults.statuses, ['Active', 'Pending'])
  assert.equal(defaults.priceMin, 0)
  assert.equal(defaults.priceMax, 20000000)
})

test('clearNeighborhoodSelectionIfNoCities clears neighborhoods when no city is selected', () => {
  const filters = {
    ...createDefaultPropertyFilters(),
    cities: [],
    neighborhoods: ['Downtown Stamford'],
  }

  const nextFilters = clearNeighborhoodSelectionIfNoCities(filters)
  assert.deepEqual(nextFilters.neighborhoods, [])
})

test('pruneNeighborhoodSelections removes neighborhoods not present in options', () => {
  const filters = {
    ...createDefaultPropertyFilters(),
    cities: ['Stamford'],
    neighborhoods: ['Downtown Stamford', 'Invalid Neighborhood'],
  }

  const nextFilters = pruneNeighborhoodSelections(filters, [
    { name: 'Downtown Stamford', city: 'Stamford' },
    { name: 'Shippan', city: 'Stamford' },
  ])

  assert.deepEqual(nextFilters.neighborhoods, ['Downtown Stamford'])
})
