try {
  const m = require('./apps/web/node_modules/lightningcss');
  console.log('SUCCESS: lightningcss loaded');
} catch (e) {
  console.error('FAIL:', e.message);
}
