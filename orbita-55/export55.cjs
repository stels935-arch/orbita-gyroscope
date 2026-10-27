// Export the same assembled concept meshes as the viewer. glTF uses metres.
// This is a visual layout export, not a manufacturing CAD model.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const T = require('../three.min.js');
const create = require('./model55.js');
const toy = create(T);
toy.setExplode(0);
toy.setState({spin: 0.35, azimuth: 0, withdraw: 1, pinLift: 1, tiltX: 0, tiltZ: 0});
toy.setShell('full');
toy.model.updateMatrixWorld(true);

const json = {
  asset: {version: '2.0', generator: 'ORBITA 55 mm layout concept - not production CAD'},
  scene: 0, scenes: [{nodes: []}], nodes: [], meshes: [], materials: [],
  accessors: [], bufferViews: [], buffers: [],
  extras: {units: 'metres', outerDiameterMM: 55, mode: 'starter withdrawn', physicalDriveValidated: false}
};
const chunks = [], materials = new Map();
let offset = 0;
function append(array, type, components) {
  const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const view = json.bufferViews.length;
  json.bufferViews.push({buffer: 0, byteOffset: offset, byteLength: bytes.length});
  chunks.push(bytes); offset += bytes.length;
  const pad = (4 - offset % 4) % 4;
  if (pad) { chunks.push(Buffer.alloc(pad)); offset += pad; }
  const accessor = {bufferView: view, componentType: 5126, count: array.length / components, type};
  if (type === 'VEC3') {
    accessor.min = [Infinity, Infinity, Infinity];
    accessor.max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < array.length; i++) {
      const j = i % 3;
      accessor.min[j] = Math.min(accessor.min[j], array[i]);
      accessor.max[j] = Math.max(accessor.max[j], array[i]);
    }
  }
  json.accessors.push(accessor);
  return json.accessors.length - 1;
}
function material(m) {
  if (materials.has(m)) return materials.get(m);
  const id = json.materials.length;
  json.materials.push({
    name: m.name || 'Layout material ' + id,
    pbrMetallicRoughness: {
      baseColorFactor: [m.color.r, m.color.g, m.color.b, m.opacity],
      metallicFactor: m.metalness || 0,
      roughnessFactor: m.roughness ?? 0.5
    },
    doubleSided: m.side === T.DoubleSide,
    alphaMode: m.transparent ? 'BLEND' : 'OPAQUE'
  });
  materials.set(m, id);
  return id;
}
const bounds = new T.Box3(), vertex = new T.Vector3();
let maxRadiusMM = 0;
toy.model.traverseVisible(mesh => {
  if (!mesh.isMesh || mesh.userData?.export === false) return;
  assert(!Array.isArray(mesh.material), 'A mesh has multiple materials; add group-aware export first.');
  const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrixWorld);
  const pos = geometry.getAttribute('position'), normal = geometry.getAttribute('normal');
  for (let i = 0; i < pos.count; i++) {
    vertex.fromBufferAttribute(pos, i);
    bounds.expandByPoint(vertex);
    maxRadiusMM = Math.max(maxRadiusMM, vertex.length());
  }
  const metres = new Float32Array(pos.array);
  for (let i = 0; i < metres.length; i++) metres[i] *= 0.001;
  const attributes = {POSITION: append(metres, 'VEC3', 3)};
  if (normal) attributes.NORMAL = append(new Float32Array(normal.array), 'VEC3', 3);
  const id = json.meshes.length;
  json.meshes.push({name: mesh.name, primitives: [{attributes, material: material(mesh.material)}]});
  json.nodes.push({name: mesh.name, mesh: id});
  json.scenes[0].nodes.push(json.nodes.length - 1);
  geometry.dispose();
});
const size = bounds.getSize(new T.Vector3());
assert(maxRadiusMM <= 27.501, 'An assembled vertex is outside the 55 mm envelope.');
assert(Math.max(size.x, size.y, size.z) <= 55.002, 'Assembled bounds exceed 55 mm.');
json.buffers.push({byteLength: offset});
let source = Buffer.from(JSON.stringify(json));
source = Buffer.concat([source, Buffer.alloc((4 - source.length % 4) % 4, 32)]);
const binary = Buffer.concat(chunks);
const header = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + source.length + 8 + binary.length, 8);
jh.writeUInt32LE(source.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
bh.writeUInt32LE(binary.length, 0); bh.writeUInt32LE(0x004e4942, 4);
const output = path.join(__dirname, 'orbita-55.glb');
fs.writeFileSync(output, Buffer.concat([header, jh, source, bh, binary]));
console.log(JSON.stringify({file: 'orbita-55.glb', bytes: fs.statSync(output).size,
  meshes: json.meshes.length, boundsMM: size, maxRadiusMM, physicalDriveValidated: false}, null, 2));
