const test = require('ava')
const huGulpDemo = require('..')

// TODO: Implement module test
test('<test-title>', t => {
  const err = t.throws(() => huGulpDemo(100), TypeError)
  t.is(err.message, 'Expected a string, got number')

  t.is(huGulpDemo('w'), 'w@zce.me')
  t.is(huGulpDemo('w', { host: 'wedn.net' }), 'w@wedn.net')
})
