export function finitePairs(rows, x, y) {
  if (!x || !y || x === y) return [];
  return rows.filter(row => typeof row[x] === 'number' && Number.isFinite(row[x])
    && typeof row[y] === 'number' && Number.isFinite(row[y]))
    .map(row => ({ x: row[x], y: row[y], z: 1 }));
}
