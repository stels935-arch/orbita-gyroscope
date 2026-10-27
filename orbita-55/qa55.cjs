// Selected geometric checks only. Does not establish safety, contact mechanics or manufacturability.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const T = require('../three.min.js');
const create = require('./model55.js');
const toy = create(T);
const EPS = 0.002;
const sweptRotorR = Math.hypot(16, 1.5);
const checks = [];
const approx = (actual, expected, tolerance = EPS) => assert(Math.abs(actual - expected) <= tolerance,
  `Expected ${expected}, got ${actual}`);
function stats(root) {
  toy.model.updateMatrixWorld(true);
  const bounds = new T.Box3(), p = new T.Vector3();
  let maxRadius = 0, minRadius = Infinity, vertices = 0, meshes = 0;
  root.traverseVisible(m => {
    if (!m.isMesh) return;
    meshes++;
    const a = m.geometry.attributes.position;
    for (let i = 0; i < a.count; i++) {
      p.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld);
      bounds.expandByPoint(p); vertices++;
      maxRadius = Math.max(maxRadius, p.length());
      minRadius = Math.min(minRadius, p.length());
    }
  });
  return {bounds, size: bounds.getSize(new T.Vector3()), maxRadius, minRadius, vertices, meshes};
}
for (const file of fs.readdirSync(__dirname).filter(f => /\.(?:js|cjs)$/.test(f))) {
  new vm.Script(fs.readFileSync(path.join(__dirname, file), 'utf8'), {filename: file});
}
checks.push('JavaScript syntax');
toy.setExplode(0);
toy.setState({spin: 0, azimuth: 0, withdraw: 1, pinLift: 1, tiltX: 0, tiltZ: 0});
toy.setShell('full');
const assembled = stats(toy.model), shellFull = stats(toy.shell).meshes;
approx(assembled.size.x, 55, 0.06);
approx(assembled.size.y, 55, 0.06);
approx(assembled.size.z, 55, 0.06);
assert(assembled.maxRadius <= 27.5 + EPS);
toy.setShell('cut'); const shellCut = stats(toy.shell).meshes;
toy.setShell('none'); const shellNone = stats(toy.shell).meshes;
assert(shellFull > shellCut && shellCut > shellNone, 'Shell modes do not hide distinct hemispheres.');
toy.setShell('full');
checks.push('55 mm assembled envelope and shell modes');

assert(toy.parts.motor && toy.parts.batteryTray && toy.parts.shaft && toy.parts.track, 'Missing tested part references');
toy.setState({spin: 0, azimuth: 0, withdraw: 0, pinLift: 0, tiltX: 0, tiltZ: 0});
let motor = stats(toy.parts.motor), roller = stats(toy.roller);
approx(motor.bounds.min.x, 3); approx(motor.bounds.max.x, 13);
approx(motor.bounds.min.y, 15.5); approx(motor.bounds.max.y, 21.5);
approx(roller.bounds.min.y, 16);
approx(stats(toy.parkPin).bounds.min.y, -0.5);
checks.push('Engaged motor envelope and nominal roller tangent at y = 16 mm');

let pathMaxRadius = 0, motorPathMinGap = Infinity;
for (let i = 0; i <= 100; i++) {
  const t = i / 100;
  toy.setState({spin: 0.35, azimuth: 0, withdraw: t, pinLift: 0, tiltX: 0, tiltZ: 0});
  motor = stats(toy.parts.motor); roller = stats(toy.roller);
  approx(motor.bounds.min.x, 3 - 3 * t);
  approx(motor.bounds.max.y, 21.5 + 1.5 * t);
  // At parked azimuth 0, the annular rotor is contained by |x| <= 1.5, radial yz <= 16.
  // If axial intervals overlap, the motor must lie strictly above the rotor.
  if (motor.bounds.min.x <= 1.5 + EPS) {
    assert(motor.bounds.min.y > 16 + 0.20, 'Motor body intersects the parked rotor envelope.');
    motorPathMinGap = Math.min(motorPathMinGap, motor.bounds.min.y - 16);
  }
  assert(roller.bounds.min.y >= 16 - EPS, 'Roller penetrates the nominal rotor envelope.');
  assert(stats(toy.parts.motor).maxRadius < 25.5, 'Motor body exits inner housing during retraction.');
  pathMaxRadius = Math.max(pathMaxRadius, stats(toy.model).maxRadius);
}
checks.push('101 parked starter positions: specified translation, roller separation and motor body clearance');

toy.setState({spin: 0, azimuth: 0, withdraw: 1, pinLift: 1, tiltX: 0, tiltZ: 0});
const motorReleased = stats(toy.parts.motor), rollerReleased = stats(toy.roller);
const battery = stats(toy.battery), tray = stats(toy.parts.batteryTray), board = stats(toy.board);
const pin = stats(toy.parkPin);
assert(motorReleased.bounds.min.y > sweptRotorR);
assert(rollerReleased.bounds.min.y > sweptRotorR);
assert(tray.bounds.max.y < -sweptRotorR);
assert(board.bounds.max.y < -sweptRotorR);
approx(pin.bounds.min.y, 2.2);
for (const [name, s] of [['motor', motorReleased], ['battery', battery], ['tray', tray], ['board', board]]) {
  assert(s.maxRadius <= 25.5 + EPS, name + ' exits the nominal inner sphere');
  // Shaft motion is confined to |y| <= 0.8; these fixed parts are in polar spaces.
  assert(s.bounds.min.y > 0.8 || s.bounds.max.y < -0.8, name + ' enters shaft sweep slab');
}
checks.push('Released motor, roller, battery tray and board outside rotor envelope; fixed volumes clear shaft slab');
checks.push('Released parking pin lower tip y = 2.2 mm');
let poseMaxRadius = 0;
for (let i = 0; i < 300; i++) {
  toy.setState({spin: i * 0.173, azimuth: 2 * Math.PI * i / 300, withdraw: 1,
    pinLift: 1, tiltX: 0, tiltZ: 0});
  const pose = stats(toy.model);
  poseMaxRadius = Math.max(poseMaxRadius, pose.maxRadius);
  assert(pose.maxRadius <= 27.5 + EPS, 'An assembled pose exits the 55 mm spherical envelope.');
}
checks.push('300 guide azimuth / rotor spin poses inside the 55 mm outer envelope');
toy.setState({spin: 0.35, azimuth: 0, withdraw: 1, pinLift: 1, tiltX: 0, tiltZ: 0});
const before = stats(toy.model).bounds.clone();
toy.setExplode(1); assert(stats(toy.model).size.y > assembled.size.y, 'Exploded view did not separate groups.');
toy.setExplode(0); const restored = stats(toy.model).bounds;
approx(before.min.distanceTo(restored.min), 0);
approx(before.max.distanceTo(restored.max), 0);
checks.push('Exploded view restores assembled transforms');

const sequencePath = path.join(__dirname, 'sequence55.js');
if (fs.existsSync(sequencePath)) {
  const sequence = require(sequencePath);
  const state = sequence.create();
  const pausedTime = state.time;
  sequence.step(state, 1);
  assert.equal(state.time, pausedTime, 'Paused sequence advanced.');
  for (let i = 0; i <= 500; i++) {
    const p = sequence.poseAt(sequence.duration * i / 500);
    for (const key of ['spin','azimuth','withdraw','pinLift','tiltX','tiltZ']) assert(Number.isFinite(p[key]));
    assert(p.withdraw >= 0 && p.withdraw <= 1 && p.pinLift >= 0 && p.pinLift <= 1);
    if (p.withdraw < 1 - 1e-8 || p.pinLift < 1 - 1e-8) {
      approx(p.azimuth, 0, 1e-8); approx(p.tiltX, 0, 1e-8); approx(p.tiltZ, 0, 1e-8);
    }
    if (p.motorPowered) {
      approx(p.withdraw, 0, 1e-8); approx(p.pinLift, 0, 1e-8); approx(p.azimuth, 0, 1e-8);
    }
    if (p.withdraw < 1 - 1e-8) approx(p.pinLift, 0, 1e-8);
  }
  sequence.toggle(state);
  for (let i = 0; i < 1000; i++) sequence.step(state, 0.025);
  approx(state.time, sequence.duration, 1e-8); assert.equal(state.playing, false);
  assert.equal(sequence.pose(state).stage, 'hand');
  sequence.select(state, 'layout');
  assert.equal(state.inCycle, false); assert.equal(state.playing, false);
  assert.equal(sequence.pose(state).stage, 'layout');
  checks.push('501 prescribed timeline samples: parked startup, motor-only contact, release before unlock, paused/completed states');
}

const glbPath = path.join(__dirname, 'orbita-55.glb');
if (fs.existsSync(glbPath)) {
  const glb = fs.readFileSync(glbPath);
  assert.equal(glb.readUInt32LE(0), 0x46546c67); assert.equal(glb.readUInt32LE(4), 2);
  assert.equal(glb.readUInt32LE(8), glb.length);
  const length = glb.readUInt32LE(12), json = JSON.parse(glb.subarray(20, 20 + length).toString('utf8'));
  assert.equal(json.extras.outerDiameterMM, 55);
  const positions = json.meshes.flatMap(m => m.primitives.map(p => json.accessors[p.attributes.POSITION]));
  for (const p of positions) {
    assert(p.min.every(v => v >= -0.027501)); assert(p.max.every(v => v <= 0.027501));
  }
  checks.push('GLB v2 header, lengths and metre-scale vertex limits');
}
const htmlPath = path.join(__dirname, 'index.html');
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
    if (/^(?:https?:|mailto:|data:)/.test(match[1])) continue;
    const target = decodeURIComponent(match[1].split(/[?#]/)[0]);
    assert(fs.existsSync(path.resolve(__dirname, target)), 'Missing local reference ' + target);
  }
  checks.push('HTML local resource references');
}
const report = {
  date: '2026-10-27', checks, assembledBoundsMM: assembled.size,
  nominalInnerRadiusMM: 25.5, rotorSweptRadiusMM: sweptRotorR,
  maxRadiusAt300PosesMM: poseMaxRadius, maxRadiusDuringWithdrawalMM: pathMaxRadius,
  minimumMotorToParkedRotorYGapWhenAxialRangesOverlapMM: motorPathMinGap,
  releasedClearancesMM: {
    motorToRotorSweptY: motorReleased.bounds.min.y - sweptRotorR,
    rollerToRotorSweptY: rollerReleased.bounds.min.y - sweptRotorR,
    batteryTrayToRotorSweptY: -tray.bounds.max.y - sweptRotorR,
    motorToInnerSphereAtVertices: 25.5 - motorReleased.maxRadius,
    batteryTrayToInnerSphereAtVertices: 25.5 - tray.maxRadius
  },
  browserQA: false, physicalDriveValidated: false, productionReady: false,
  limits: [
    'Selected nominal envelope checks, not a complete collision/clearance or tolerance analysis.',
    'Motor and cell are layout envelopes; no part selection, power, speed or runtime is verified.',
    'No contact/friction, spring/latch actuation, electrical, strength, thermal or child-safety validation.'
  ]
};
fs.writeFileSync(path.join(__dirname, 'qa55.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
