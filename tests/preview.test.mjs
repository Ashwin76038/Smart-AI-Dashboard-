import test from 'node:test';
import assert from 'node:assert/strict';
import { finitePairs } from '../src/lib/previewData.mjs';

test('scatter preserves measured zeros and omits missing/nonfinite values', () => {
  assert.deepEqual(finitePairs([
    {a: 0, b: 4}, {a: null, b: 3}, {a: '', b: 2},
    {a: 1, b: undefined}, {a: Infinity, b: 1}, {a: 2, b: 5},
  ], 'a', 'b'), [{x: 0, y: 4, z: 1}, {x: 2, y: 5, z: 1}]);
});
test('one numeric field cannot create a fabricated self-correlation', () => {
  assert.deepEqual(finitePairs([{a: 1}], 'a', undefined), []);
  assert.deepEqual(finitePairs([{a: 1}], 'a', 'a'), []);
});
