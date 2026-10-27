/* ORBITA 55: millimetres, nominal packaging concept, NOT production CAD.
 * Motor and cell are reserved envelopes, not selected or qualified components.
 * Prescribed positions do not validate wrist drive, electrical safety or strength.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.createOrbit55 = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createOrbit55(T) {
  'use strict';
  const dimensions = Object.freeze({
    diameter: 55, outerRadius: 27.5, innerRadius: 25.5, shellThickness: 2,
    rotorOD: 32, rotorID: 24, rotorThickness: 3,
    rotorSweptRadius: Math.hypot(16, 1.5), shaftDiameter: 1.6, shaftLength: 48.6,
    motorDiameter: 6, motorLength: 10, motorCenterEngaged: [8, 18.5, 0],
    starterTravel: [-3, 1.5, 0], rollerRadius: 2.5, rollerWidth: 1.2,
    batterySizeXYZ: [20, 4, 10], batteryCenter: [0, -19.6, 0],
    traySizeXYZ: [20.8, 4.8, 10.8], boardSizeXYZ: [10, 1.6, 5],
    boardCenter: [0, -19.6, 8.5], trackInnerRadius: 23.4, trackOuterRadius: 25.2,
    guideRadius: 22.5, parkPinRadius: 0.6, parkPinTravel: 2.7,
    wireRouteRadius: 26.2, componentSelectionComplete: false
  });
  const model = new T.Group(); model.name = 'ORBITA 55 mm electric-start packaging concept';
  const body = new T.Group(); body.name = 'Housing coordinates'; model.add(body);
  const parts = {}, anchors = {};
  const material = (name, color, metalness = 0.2, roughness = 0.4) => {
    const m = new T.MeshStandardMaterial({color, metalness, roughness}); m.name = name; return m;
  };
  const mats = {
    rotor: material('Rotor - illustrative metal', 0xcda75f, 0.72, 0.28),
    teal: material('Guide and supports', 0x376b66, 0.3, 0.35),
    steel: material('Shaft and contact parts', 0xb8c9cc, 0.75, 0.23),
    motor: material('Motor envelope - not selected', 0xe78759, 0.4, 0.36),
    battery: material('Battery envelope - not selected', 0x5597bc, 0.1, 0.45),
    board: material('PCB reserve', 0x4a8b6c, 0.15, 0.5),
    dark: material('Roller friction material - to be selected', 0x33484e, 0.05, 0.8),
    tray: material('Cell pocket concept', 0xd6e2dc, 0.05, 0.5),
    red: material('Identification / positive route', 0xcb665c, 0.1, 0.45),
    blue: material('Identification mark', 0x467d9f, 0.1, 0.45),
    black: material('Negative route', 0x41434a, 0.1, 0.5),
    chip: material('Control electronics reserve', 0x33453f, 0.15, 0.5)
  };
  const glassOuter = new T.MeshPhysicalMaterial({color:0xb5dcd1, transparent:true, opacity:0.12,
    roughness:0.2, metalness:0, depthWrite:false, side:T.FrontSide});
  glassOuter.name = 'Outer shell surface';
  const glassInner = glassOuter.clone(); glassInner.side = T.BackSide; glassInner.opacity = 0.07;
  glassInner.name = 'Inner shell surface';
  const cutMaterial = new T.MeshStandardMaterial({color:0x8bb7aa, metalness:0.1,
    roughness:0.6, side:T.DoubleSide}); cutMaterial.name = '2 mm section face';
  const group = (name, parent = body) => {const g = new T.Group(); g.name = name; parent.add(g); return g;};
  const mesh = (name, geometry, mat, parent = body, xyz = [0,0,0]) => {
    const m = new T.Mesh(geometry, mat); m.name = name; m.position.set(...xyz); parent.add(m); return m;
  };
  const box = (name, xyzSize, xyz, mat, parent) => mesh(name, new T.BoxGeometry(...xyzSize), mat, parent, xyz);
  const cylinderGeometry = (radius, length, axis = 'y', segments = 48) => {
    const g = new T.CylinderGeometry(radius, radius, length, segments);
    if (axis === 'x') g.rotateZ(-Math.PI / 2);
    if (axis === 'z') g.rotateX(Math.PI / 2);
    return g;
  };
  const annulusGeometry = (inner, outer, length, axis = 'y') => {
    const s = new T.Shape(); s.absarc(0, 0, outer, 0, Math.PI * 2, false);
    const hole = new T.Path(); hole.absarc(0, 0, inner, 0, Math.PI * 2, true); s.holes.push(hole);
    const g = new T.ExtrudeGeometry(s, {depth:length, bevelEnabled:false, steps:1, curveSegments:48});
    g.translate(0, 0, -length / 2);
    if (axis === 'x') g.rotateY(Math.PI / 2);
    if (axis === 'y') g.rotateX(-Math.PI / 2);
    return g;
  };
  const anchor = (key, parent, xyz) => {const a = new T.Object3D(); a.name = key + ' label anchor';
    a.position.set(...xyz); parent.add(a); anchors[key] = a; return a;};
  const rod = (name, a, b, radius, mat, parent = body) => {
    const av = new T.Vector3(...a), bv = new T.Vector3(...b), d = bv.clone().sub(av);
    const m = mesh(name, cylinderGeometry(radius, d.length()), mat, parent);
    m.position.copy(av).add(bv).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), d.normalize()); return m;
  };

  // Two genuinely hollow hemispheres, with the front z-positive half removable.
  const shell = group('Hollow shell - outer 55 / inner 51 mm');
  const front = group('Front shell hemisphere', shell), back = group('Rear shell hemisphere', shell);
  for (const [g, start] of [[front,0], [back,Math.PI]]) {
    mesh('Outer hemisphere', new T.SphereGeometry(27.5,48,28,start,Math.PI), glassOuter, g);
    mesh('Inner hemisphere', new T.SphereGeometry(25.5,48,28,start,Math.PI), glassInner, g);
  }
  const sectionFace = mesh('Shell wall section 2 mm', new T.RingGeometry(25.5,27.5,96), cutMaterial, back);
  shell.front = front; shell.back = back;
  parts.shellFront = front; parts.shellBack = back; parts.sectionFace = sectionFace;

  const track = group('Fixed equatorial race lips');
  for (const sign of [-1,1]) mesh('Fixed race lip', annulusGeometry(23.4,25.2,0.6), mats.teal, track, [0,sign*1.2,0]);
  parts.race = parts.track = track;
  anchor('track', track, [-24.2,1.2,0]);

  const guide = group('Precessing guide - axis remains in equatorial plane');
  const gap = 0.08, parkingGap = 0.11;
  for (const [from,to] of [[gap,Math.PI/2-parkingGap], [Math.PI/2+parkingGap,Math.PI-gap], [Math.PI+gap,Math.PI*2-gap]]) {
    const g = new T.TorusGeometry(22.5,0.45,10,Math.ceil((to-from)*35),to-from);
    g.rotateZ(from); g.rotateX(Math.PI/2); mesh('Guide arc with functional clearance',g,mats.steel,guide);
  }
  for (const sign of [-1,1]) mesh('Shaft guide collar - through bore', annulusGeometry(0.9,1.8,1.6,'x'), mats.teal, guide, [sign*22.5,0,0]);
  const parkCollar = mesh('Parking collar - through bore', annulusGeometry(0.7,2.5,1.2,'y'), mats.teal, guide, [0,0,22.5]);
  parts.guide = guide; parts.parkCollar = parkCollar;

  const rotor = group('Rigid symmetric rotor assembly', guide);
  const rotorRing = mesh('Rotor ring 32 x 24 x 3 mm', annulusGeometry(12,16,3,'x'), mats.rotor, rotor);
  const hub = mesh('Hub with shaft bore', annulusGeometry(0.8,3,3,'x'), mats.steel, rotor);
  for (let i=0;i<4;i++) {
    const a = i*Math.PI/2;
    const spoke = box('Rotor spoke', [1.2,9,1.2], [0,Math.cos(a)*7.5,Math.sin(a)*7.5], mats.teal, rotor);
    spoke.rotation.x = a;
  }
  const shaft = mesh('Shaft fixed to rotor - 1.6 x 48.6 mm', cylinderGeometry(0.8,48.6,'x'), mats.steel, rotor);
  // Flat colour marks indicate opposite positions; they are not loose balls or load components.
  const markGroup = group('Paint identification marks', rotor);
  for (const [i,a] of [[0,0.34],[1,Math.PI+0.34]]) for (const sign of [-1,1]) {
    const g = new T.RingGeometry(13,15.2,12,1,a,0.2); g.rotateY(Math.PI/2);
    const m = mesh('Paint mark - not a ball',g,i?mats.blue:mats.red,markGroup,[sign*1.501,0,0]);
    m.material = m.material.clone(); m.material.side = T.DoubleSide;
    m.userData.decorative = true;
  }
  parts.rotor = rotor; parts.rotorRing = rotorRing; parts.hub = hub; parts.shaft = shaft;
  anchor('rotor', rotor, [1.6,12.8,5.6]);

  const starter = group('Retractable starter carriage');
  const motor = mesh('Motor envelope diameter 6 length 10 - NOT a selected component', cylinderGeometry(3,10,'x'), mats.motor, starter, [8,18.5,0]);
  const motorEnd = mesh('Illustrative motor end cap',cylinderGeometry(2.8,0.12,'x'),mats.steel,starter,[12.9,18.5,0]);
  motorEnd.userData.decorative = true;
  const driveShaft = mesh('Starter output shaft',cylinderGeometry(0.45,3,'x'),mats.steel,starter,[1.5,18.5,0]);
  const roller = group('Retractable friction roller',starter); roller.position.set(0,18.5,0);
  const rollerMesh = mesh('Friction roller diameter 5 width 1.2',cylinderGeometry(2.5,1.2,'x'),mats.dark,roller);
  const stripe = box('Roller rotation identification stripe',[0.01,3.6,0.16],[0.605,0,0],mats.motor,roller);
  stripe.userData.decorative = true;
  for (const x of [5,10]) {
    const g = new T.TorusGeometry(3.15,0.15,8,48); g.rotateY(Math.PI/2);
    mesh('Motor support band',g,mats.teal,starter,[x,18.5,0]);
  }
  // Schematic carriage rails show the translation, but not a complete return/actuation design.
  const rails = group('Starter slide-guide concept - actuation not designed');
  for (const z of [-4,4]) {
    rod('Stationary diagonal slide rail',[5.5,18.25,z],[1.5,20.25,z],0.22,mats.steel,rails);
    rod('Carriage ear',[5,18.5,Math.sign(z)*3.28],[5,18.5,z],0.18,mats.teal,starter);
    const sleeve = mesh('Carriage guide sleeve',annulusGeometry(0.28,0.52,0.65,'y'),mats.teal,starter,[5,18.5,z]);
    sleeve.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(-3,1.5,0).normalize());
  }
  parts.starter = starter; parts.motor = motor; parts.motorEnd = motorEnd;
  parts.driveShaft = driveShaft; parts.roller = rollerMesh; parts.rollerAssembly = roller; parts.starterRails = rails;
  anchor('motor',starter,[8,20.2,2.2]); anchor('roller',roller,[0,0,0]);

  const battery = group('Cell and protected pocket - reserved envelope');
  const cell = box('Cell reserve 20 x 10 x 4 mm - capacity not specified',[20,4,10],[0,0,0],mats.battery,battery);
  const tray = group('Battery pocket - nominal 0.4 mm walls',battery);
  box('Pocket base',[20.8,0.4,10.8],[0,-2.2,0],mats.tray,tray);
  for (const sign of [-1,1]) {
    box('Pocket long wall',[20.8,4.4,0.4],[0,0.2,sign*5.2],mats.tray,tray);
    box('Pocket end wall',[0.4,4.4,10],[sign*10.2,0.2,0],mats.tray,tray);
    box('Cell terminal reserve',[1.2,0.2,0.8],[sign*7,2.15,0],sign>0?mats.red:mats.black,battery);
  }
  parts.battery = cell; parts.batteryAssembly = battery; parts.batteryTray = tray;
  anchor('battery',battery,[0,0,5.1]);

  const board = group('Charge and protection PCB envelope');
  const pcb = box('PCB reserve 10 x 5 x 1.6 mm',[10,1.6,5],[0,0,0],mats.board,board);
  const chip = box('Control package reserve',[3.8,0.6,2.4],[-1,1.1,0],mats.chip,board);
  for (const x of [-3.7,3.7]) for (const z of [-1.5,0,1.5]) box('PCB pad',[0.7,0.05,0.6],[x,0.825,z],mats.rotor,board);
  parts.board = pcb; parts.boardAssembly = board; parts.boardChip = chip;
  anchor('board',board,[0,0.8,2.5]);

  const parking = group('Parking latch concept - interlock actuation not designed');
  const pinGuide = mesh('Fixed pin-guide sleeve',annulusGeometry(0.7,1.15,4,'y'),mats.teal,parking,[0,4,22.5]);
  const parkPin = mesh('Retracting parking pin',cylinderGeometry(0.6,3,'y'),mats.rotor,parking,[0,1,22.5]);
  parts.parkPin = parkPin; parts.parkPinGuide = pinGuide; parts.parking = parking;
  anchor('park',parkPin,[0,-0.8,0]);

  const wiring = group('Reserved wiring route IN housing wall - not a wiring diagram');
  for (const sign of [-1,1]) {
    const points = [], x = sign*0.7, yzRadius = Math.sqrt(26.2*26.2-x*x);
    for (let i=0;i<=48;i++) {const a=-1.05+2.1*i/48; points.push(new T.Vector3(x,yzRadius*Math.sin(a),-yzRadius*Math.cos(a)));}
    mesh('Wall conduit reserve',new T.TubeGeometry(new T.CatmullRomCurve3(points),64,0.16,6,false),sign>0?mats.red:mats.black,wiring);
  }
  parts.wiring = wiring;
  // Button envelope sits inside the outer 55 mm sphere; its mounting is not detailed.
  const button = mesh('Start button envelope',cylinderGeometry(2.1,0.5,'y'),mats.teal,body,[0,27.0,0]);
  parts.button = button;

  let explode = 0, shellMode = 'cut';
  const state = {spin:0.45,azimuth:0.25,withdraw:1,pinLift:1,tiltX:0,tiltZ:0,rollerSpin:0};
  const finite = (v, fallback) => Number.isFinite(v) ? v : fallback;
  const clamp = v => Math.max(0,Math.min(1,v));
  function apply() {
    body.rotation.set(state.tiltX,0,state.tiltZ);
    guide.rotation.y=state.azimuth; rotor.rotation.x=state.spin;
    starter.position.set(-3*state.withdraw,1.5*state.withdraw+18*explode,0);
    roller.rotation.x=state.rollerSpin;
    rails.position.y=18*explode;
    battery.position.set(0,-19.6-15*explode,0);
    board.position.set(0,-19.6-15*explode,8.5);
    parkPin.position.set(0,1+2.7*state.pinLift,22.5);
    parking.position.z=12*explode;
    front.position.z=25*explode; back.position.z=-25*explode;
    wiring.visible=explode<0.01;
    front.visible=shellMode==='full'; back.visible=shellMode!=='none';
    sectionFace.visible=shellMode==='cut';
  }
  function setState(next={}) {
    for(const key of ['spin','azimuth','tiltX','tiltZ']) state[key]=finite(next[key],state[key]);
    for(const key of ['withdraw','pinLift']) state[key]=clamp(finite(next[key],state[key]));
    // Once separated, the starter must not keep following the hand-driven rotor.
    if(Number.isFinite(next.rollerSpin)) state.rollerSpin=next.rollerSpin;
    else if(state.withdraw<0.001) state.rollerSpin=-state.spin*16/2.5;
    apply();
  }
  function setShell(mode) {shellMode=['full','cut','none'].includes(mode)?mode:'cut';apply();}
  function setExplode(value) {explode=clamp(finite(value,0));apply();}
  apply();
  return {model,body,shell,rotor,guide,starter,battery,board,roller,parkPin,
    parts,anchors,setShell,setState,setExplode,dimensions};
});
