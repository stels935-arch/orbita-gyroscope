// DOM/renderer-stub and prescribed sequence tests; NOT real-browser or physical-drive validation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const T=require('../three.min.js'),create=require('./model55.js'),Sequence=require('./sequence55.js');
let poseCount=0;
for(let t=0;t<=Sequence.duration;t+=.003){const p=Sequence.poseAt(t);if(p.azimuth!==0&&t>=1){assert.equal(p.withdraw,1);assert.equal(p.pinLift,1);assert.equal(p.motorPowered,false);}if(p.motorPowered){assert.equal(p.withdraw,0);assert.equal(p.pinLift,0);assert.equal(p.azimuth,0);}if(t>6){assert.equal(p.motorPowered,false);assert.equal(p.withdraw,1);}if(t>5.01){assert.equal(p.rollerSpin,-6.4*6.35);}poseCount++;}
const m=Sequence.create();Sequence.step(m,.03);assert.equal(m.time,0);Sequence.toggle(m);for(let i=0;i<100;i++)Sequence.step(m,.02);Sequence.toggle(m);const paused=m.time;Sequence.step(m,.04);assert.equal(m.time,paused);Sequence.toggle(m);for(let i=0;i<1000;i++)Sequence.step(m,.02);assert.equal(m.time,Sequence.duration);assert.equal(m.playing,false);
for(const stage of ['layout','start','release','hand']){Sequence.select(m,stage);assert.equal(Sequence.pose(m).stage,stage);assert.equal(m.playing,false);}
class El{constructor(data={}){this.dataset=data;this.handlers={};this.style={};this.attributes={};this.classList={toggle:(k,v)=>this.attributes['class:'+k]=v};this.clientWidth=850;this.clientHeight=600;this.checked=true;this.value='0';this.hidden=false;this.textContent='';}addEventListener(k,f){this.handlers[k]=f;}setAttribute(k,v){this.attributes[k]=v;}appendChild(){}setPointerCapture(){}send(k,e={}){this.handlers[k]?.({target:this,preventDefault(){},...e});}}
const html=fs.readFileSync(__dirname+'/index.html','utf8'),source=fs.readFileSync(__dirname+'/viewer55.js','utf8'),els={};for(const match of html.matchAll(/id="([^"]+)"/g))els[match[1]]=new El();
const views=['perspective','front','top'].map(view=>new El({view})),shells=['full','cut','none'].map(shell=>new El({shell})),stages=['layout','start','release','hand'].map(stage=>new El({stage}));
const lists={'[data-view]':views,'[data-shell]':shells,'[data-stage]':stages};let toy,frame,frames=0;
class Renderer{setSize(){}setPixelRatio(){}render(){frames++;}}
const document={hidden:false,getElementById:id=>els[id],createElement:()=>new El(),addEventListener(){},querySelectorAll:q=>lists[q]||[]};
const env={THREE:{...T,WebGLRenderer:Renderer},Orbit55Sequence:Sequence,createOrbit55:()=>{toy=create(T);return toy;},document,window:{devicePixelRatio:1},ResizeObserver:class{constructor(f){this.f=f;}observe(){this.f();}},performance:{now:()=>0},requestAnimationFrame:f=>frame=f,console};
vm.runInNewContext(source,env);
shells[2].send('click');assert.equal(toy.shell.front.visible,false);assert.equal(toy.shell.back.visible,false);shells[0].send('click');assert(toy.shell.front.visible&&toy.shell.back.visible);shells[1].send('click');assert(!toy.shell.front.visible&&toy.shell.back.visible);
stages[1].send('click');assert(Math.abs(toy.starter.position.x)<1e-9);assert.equal(toy.parkPin.position.y,1);assert.match(els['power-status'].textContent,/включён/);
stages[2].send('click');assert.equal(toy.starter.position.x,-3);assert.equal(toy.parkPin.position.y,1);assert.match(els['power-status'].textContent,/выключен/);
stages[3].send('click');assert.equal(toy.parkPin.position.y,3.7);assert.equal(toy.starter.position.x,-3);
els.explode.value='100';els.explode.send('input');assert.equal(els['explode-value'].value,'100%');assert.equal(toy.starter.position.y,19.5);els.explode.value='0';els.explode.send('input');assert.equal(toy.starter.position.y,1.5);
stages[0].send('click');els.cycle.send('click');for(let i=0;i<200;i++)frame(i*16.667);assert.match(els['power-status'].textContent,/включён/);els.cycle.send('click');const stopped=toy.rotor.rotation.x;frame(3500);assert.equal(toy.rotor.rotation.x,stopped);els.cycle.send('click');for(let i=211;i<1100;i++)frame(i*16.667);assert.match(els['power-status'].textContent,/выключен/);assert.equal(toy.starter.position.x,-3);assert.equal(toy.parkPin.position.y,3.7);assert.match(els.cycle.textContent,/Показать весь цикл/);
for(const view of views)view.send('click');els['camera-reset'].send('click');els.scene.send('keydown',{key:'ArrowLeft'});els.scene.send('wheel',{deltaY:100});els['show-labels'].checked=false;els['show-labels'].send('change');assert.equal(els.labels.hidden,true);assert(frames>800);
// Entry points referenced by the viewer must exist in the real document.
for(const match of source.matchAll(/\$\('([^']+)'\)/g))assert(els[match[1]],'Missing element '+match[1]);
const report={passed:['timeline interlocks','motor off during hand play','roller decoupled after withdrawal','play/pause/complete','shell modes','stage selection','explosion and assembly','camera and label controls','HTML IDs'],sequenceSamples:poseCount,browser:false,renderer:'stub',physicalDriveValidated:false};
fs.writeFileSync(__dirname+'/viewer55-test.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
