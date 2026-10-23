// Offline checks only. No network requests or browser emulation.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const html = read('index.html');
assert.equal(html, read('Открыть Гироскоп.html'), 'HTML entry points must match');
for (const file of ['app.js', 'model.js', 'motion.js']) new vm.Script(read(file));
for (const match of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
  if (/^https:/.test(match[1])) continue;
  assert(fs.existsSync(path.join(__dirname, match[1])), 'Missing asset: ' + match[1]);
}
const T = require('./three.min.js');
const toy = require('./model.js')(T);
assert.equal(toy.diameter, 280);
assert.equal(toy.balls.length, 2);
const glb = fs.readFileSync(path.join(__dirname, 'orbit-gyro.glb'));
assert.equal(glb.readUInt32LE(0), 0x46546c67);
assert.equal(glb.readUInt32LE(4), 2);
assert.equal(glb.readUInt32LE(8), glb.length);
console.log('PASS: matching entry points, JS syntax, local assets, 280 mm model, two balls, GLB header.');
