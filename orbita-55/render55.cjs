// CPU projection of concept mesh triangles, not a browser screenshot or a physics simulation.
const fs = require('node:fs');
const path = require('node:path');
const T = require('../three.min.js');
const sharp = require('sharp');
const create = require('./model55.js');
const W = 1600, H = 1160;
const area = {x: 35, y: 150, w: 1000, h: 900};
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const colors = {ink:'#173f39', muted:'#526f68', line:'#9cb6ab', gold:'#ab7732', coral:'#bf6245', blue:'#397f9e', green:'#397760'};
function text(x, y, value, size = 22, color = colors.ink, weight = 400) {
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}">${esc(value)}</text>`;
}
async function render(exploded) {
  const toy = create(T);
  toy.setState({spin: 0.35, azimuth: 0, withdraw: 1, pinLift: 1, tiltX: 0, tiltZ: 0});
  toy.setShell(exploded ? 'full' : 'cut');
  toy.setExplode(exploded ? 1 : 0);
  toy.model.updateMatrixWorld(true);
  const scale = exploded ? 7.7 : 13.7;
  const halfW = area.w / scale / 2, halfH = area.h / scale / 2;
  const camera = new T.OrthographicCamera(-halfW, halfW, halfH, -halfH, 1, 500);
  camera.position.set(84, 43, 100).normalize().multiplyScalar(180);
  camera.lookAt(0, exploded ? 0 : 0, 0); camera.updateMatrixWorld();
  const project = p => {
    const v = p.clone().project(camera);
    return [area.x + (v.x * .5 + .5) * area.w, area.y + (-v.y * .5 + .5) * area.h];
  };
  const faces = [], light = new T.Vector3(-.25, .8, 1).normalize();
  toy.model.traverseVisible(m => {
    if (!m.isMesh || m.userData?.export === false) return;
    const g = m.geometry, position = g.attributes.position, idx = g.index;
    if (Array.isArray(m.material)) throw new Error('Multiple materials need group-aware rendering.');
    const mat = m.material;
    for (let k = 0; k < (idx ? idx.count : position.count); k += 3) {
      const vertices = [0,1,2].map(j => new T.Vector3().fromBufferAttribute(position,
        idx ? idx.getX(k+j) : k+j).applyMatrix4(m.matrixWorld));
      const normal = vertices[1].clone().sub(vertices[0]).cross(vertices[2].clone().sub(vertices[0]));
      if (normal.lengthSq() < 1e-12) continue;
      normal.normalize();
      const center = vertices[0].clone().add(vertices[1]).add(vertices[2]).multiplyScalar(1/3);
      const view = camera.position.clone().sub(center);
      if (normal.dot(view) < 0) {
        if (mat.side !== T.DoubleSide) continue;
        normal.negate();
      }
      const shading = .67 + .33 * Math.max(0, normal.dot(light));
      const c = mat.color.clone().convertLinearToSRGB();
      const color = '#' + [c.r,c.g,c.b].map(v => Math.max(0, Math.min(255, Math.round(v*255*shading+5))).toString(16).padStart(2,'0')).join('');
      const opacity = mat.transparent ? Math.min(.13, mat.opacity) : 1;
      const d = 'M' + vertices.map(v => project(v).map(n => n.toFixed(2)).join(',')).join('L') + 'Z';
      faces.push({z: center.clone().applyMatrix4(camera.matrixWorldInverse).z,
        svg: `<path d="${d}" fill="${color}" fill-opacity="${opacity}"${mat.transparent?'':` stroke="${color}" stroke-width="0.35"`}/>`});
    }
  });
  faces.sort((a,b) => a.z-b.z);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><radialGradient id="paper"><stop stop-color="#fffdf5"/><stop offset="1" stop-color="#e7eee5"/></radialGradient><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${colors.muted}"/></marker></defs><rect width="1600" height="1160" fill="url(#paper)"/>`;
  svg += text(58, 68, 'ОРБИТА 55', 46, colors.ink, 700);
  svg += text(60, 105, exploded ? 'Разнесённый вид · что находится внутри' : 'Разрез · двигатель только для запуска', 24, colors.muted);
  svg += `<line x1="58" y1="132" x2="1540" y2="132" stroke="${colors.line}"/>`;
  if (!exploded) {
    const [cx,cy] = project(new T.Vector3());
    svg += `<circle cx="${cx}" cy="${cy}" r="${27.5*scale}" fill="#b9d5cb" fill-opacity=".12"/>`;
  }
  svg += faces.map(f => f.svg).join('');
  if (!exploded) {
    const [cx,cy] = project(new T.Vector3());
    svg += `<circle cx="${cx}" cy="${cy}" r="${27.5*scale}" fill="none" stroke="${colors.line}" stroke-width="2"/>`;
    const a = cx-27.5*scale, b = cx+27.5*scale, y = 1040;
    svg += `<path d="M${a},${cy+35}V${y+12}M${b},${cy+35}V${y+12}" fill="none" stroke="${colors.line}" stroke-width="1.5" stroke-dasharray="5 6"/><path d="M${a},${y}H${b}" stroke="${colors.muted}" stroke-width="1.7" marker-start="url(#arrow)" marker-end="url(#arrow)"/>`;
    svg += `<rect x="${cx-82}" y="${y-21}" width="164" height="40" rx="10" fill="#edf1e7"/>` + text(cx-61, y+8, 'Ø 55 мм', 28, colors.ink, 700);
  }
  const entries = [
    ['rotor', 'Кольцевой ротор', 'Ø32 / Ø24 × 3 мм', colors.gold, 45, 35],
    ['motor', 'Двигатель', 'Резерв Ø6 × 10 мм', colors.coral, -45, -36],
    ['roller', 'Прижимной ролик', 'Отведён после запуска', colors.coral, -64, 20],
    ['battery', 'Аккумулятор', 'Резерв 20 × 10 × 4 мм', colors.blue, -46, 30],
    ['board', 'Плата управления', 'Резерв; схема не выбрана', colors.green, 53, 23],
    ['park', 'Парковочный стопор', 'Поднят в режиме игры', colors.gold, 36, -25],
    ['track', 'Направляющая', 'Вал меняет направление', colors.green, -62, 20]
  ];
  entries.forEach(([key,title,subtitle,color,dx,dy], i) => {
    const anchor = toy.anchors[key];
    if (!anchor) throw new Error('Missing render anchor ' + key);
    const [x,y] = project(anchor.getWorldPosition(new T.Vector3()));
    const bx = x+dx, by = y+dy;
    svg += `<path d="M${x},${y}L${bx},${by}" stroke="${color}" stroke-width="1.6"/><circle cx="${bx}" cy="${by}" r="17" fill="${color}" stroke="#fffdf5" stroke-width="2"/><text x="${bx}" y="${by+6}" text-anchor="middle" fill="white" font-family="Arial" font-size="18" font-weight="700">${i+1}</text>`;
    const ly = 220 + i*111;
    svg += `<circle cx="1120" cy="${ly}" r="17" fill="${color}"/>`;
    svg += `<text x="1120" y="${ly+6}" text-anchor="middle" fill="white" font-family="Arial" font-size="18" font-weight="700">${i+1}</text>`;
    svg += text(1154, ly+5, title, 23, colors.ink, 700);
    svg += text(1154, ly+36, subtitle, 19, colors.muted);
  });
  if (exploded) svg += text(71, 1048, 'В собранном виде: Ø55 мм. Разнесение показано только для осмотра.', 21, colors.muted);
  svg += `<line x1="58" y1="1080" x2="1540" y2="1080" stroke="${colors.line}"/>`;
  svg += text(60, 1113, 'Компоновочная концепция. Габариты компонентов условные; привод и безопасность не подтверждены.', 21, colors.muted);
  svg += text(60, 1142, 'Геометрический рендер, не снимок браузера. Двигатель и аккумулятор не являются выбранными покупными деталями.', 17, colors.muted);
  svg += '</svg>';
  const name = exploded ? 'exploded55' : 'preview55';
  fs.writeFileSync(path.join(__dirname, name+'.svg'), svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname, name+'.png'));
  console.log(JSON.stringify({file:name+'.png',width:W,height:H,triangles:faces.length,browserScreenshot:false}));
}
(async()=>{await render(false);await render(true);})().catch(error=>{console.error(error);process.exitCode=1;});
