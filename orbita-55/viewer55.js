(()=>{
  'use strict';
  const $=id=>document.getElementById(id),canvas=$('scene'),host=$('viewport');
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(error){$('error').hidden=false;return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.4;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,1000),toy=createOrbit55(THREE),state=Orbit55Sequence.create();
  scene.add(toy.model);toy.setShell('cut');
  scene.add(new THREE.HemisphereLight(0xfffef3,0x769a91,2.4));
  const key=new THREE.DirectionalLight(0xffe9cc,3);key.position.set(45,70,80);scene.add(key);
  const fill=new THREE.DirectionalLight(0xb1d9df,1.5);fill.position.set(-70,10,-25);scene.add(fill);
  let explode=0,shellMode='cut',lastTime=0,lastPhase='',lastPlaying=false;
  const orbit={yaw:1.0,polar:1.10,zoom:1};
  function updateCamera(){const r=98*(1+explode*.75)*Math.max(1,.9/camera.aspect)*orbit.zoom;camera.position.set(r*Math.sin(orbit.polar)*Math.sin(orbit.yaw),r*Math.cos(orbit.polar),r*Math.sin(orbit.polar)*Math.cos(orbit.yaw));camera.lookAt(0,0,0);camera.updateMatrixWorld();}
  function resize(){if(!host.clientWidth||!host.clientHeight)return;camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight,false);updateCamera();}
  new ResizeObserver(resize).observe(host);resize();
  function pressed(selector,key,value){document.querySelectorAll(selector).forEach(b=>{const active=b.dataset[key]===value;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
  function view(name){orbit.yaw=name==='front'?Math.PI/2:name==='top'?.3:1.0;orbit.polar=name==='top'?.03:name==='front'?Math.PI/2:1.10;orbit.zoom=1;pressed('[data-view]','view',name);updateCamera();}
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));
  $('camera-reset').addEventListener('click',()=>view('perspective'));
  document.querySelectorAll('[data-shell]').forEach(b=>b.addEventListener('click',()=>{shellMode=b.dataset.shell;toy.setShell(shellMode);pressed('[data-shell]','shell',shellMode);viewTag();}));
  function viewTag(){$('view-tag').textContent=explode>0?'РАЗНЕСЁННЫЙ ВИД · НЕ РАБОЧЕЕ ПОЛОЖЕНИЕ':shellMode==='cut'?'ПЕРЕДНЯЯ ПОЛОВИНА СНЯТА':shellMode==='none'?'ОБОЛОЧКА СКРЫТА':'ПРОЗРАЧНАЯ ОБОЛОЧКА';}
  $('show-labels').addEventListener('change',e=>$('labels').hidden=!e.target.checked);
  $('explode').addEventListener('input',e=>{explode=Number(e.target.value)/100;$('explode-value').value=Math.round(explode*100)+'%';toy.setExplode(explode);updateCamera();viewTag();});
  const labelSpec=[['rotor','1','#9b7528'],['motor','2','#bf6337'],['roller','3','#465754'],['battery','4','#3e7cb0'],['board','5','#487b54'],['park','6','#93595b'],['track','7','#387b71']];
  const labels=labelSpec.map(([key,text,color])=>{const el=document.createElement('span');el.className='node-label';el.textContent=text;el.style.borderColor=color;el.style.color=color;$('labels').appendChild(el);return{key,el};});
  const descriptions={
    layout:'Сверху — стартер. Снизу — аккумулятор и плата. В центре — кольцевой ротор.',
    align:'Перед пуском обойма совмещается с парковочным положением. Способ её позиционирования ещё нужно разработать.',
    lock:'Парковочный стопор удерживает обойму. Сам ротор остаётся свободным для вращения.',
    engage:'При зафиксированной обойме каретка подводит ролик к наружной поверхности ротора.',
    spin:'Мотор передаёт вращение через ролик. Ролик и ротор вращаются в противоположных направлениях.',
    withdraw:'Каретка отходит: на 3 мм в сторону и 1,5 мм вверх. Контакт разрывается; обойма пока зафиксирована.',
    released:'Ролик полностью отведён, мотор выключен. Стопор ещё удерживает обойму.',
    unlock:'Только после отвода стартера парковочный стопор освобождает обойму.',
    hand:'Мотор выключен и не связан с ротором. Показаны движения при игре руками; передача энергии от рук ещё не рассчитана.'
  };
  function stateUI(p){
    const signature=p.phase+':'+p.motorPowered+':'+state.playing+':'+state.time.toFixed(0)+':'+state.inCycle;
    if(signature===lastPhase)return;lastPhase=signature;
    pressed('[data-stage]','stage',p.stage);
    $('power-status').textContent=p.motorPowered?'Мотор включён — пуск':'Мотор выключен';$('power-dot').classList.toggle('on',p.motorPowered);
    $('status').textContent=descriptions[p.phase];
    $('cycle').textContent=state.playing?'Ⅱ Пауза':state.inCycle&&state.time<Orbit55Sequence.duration?'▶ Продолжить цикл':'▶ Показать весь цикл';
    $('cycle').setAttribute('aria-pressed',String(state.playing));
  }
  document.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>{Orbit55Sequence.select(state,b.dataset.stage);lastPhase='';apply();}));
  $('cycle').addEventListener('click',()=>{Orbit55Sequence.toggle(state);lastPhase='';apply();});
  function apply(){const p=Orbit55Sequence.pose(state);toy.setState(p);toy.setExplode(explode);stateUI(p);return p;}
  const pointers=new Map();let pinch=0;
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});pinch=0;});
  canvas.addEventListener('pointermove',e=>{const old=pointers.get(e.pointerId);if(!old)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){orbit.yaw-=(e.clientX-old.x)*.007;orbit.polar=Math.max(.03,Math.min(Math.PI-.03,orbit.polar+(e.clientY-old.y)*.007));}else{const p=[...pointers.values()],distance=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(pinch&&distance)orbit.zoom=Math.max(.7,Math.min(2,orbit.zoom*pinch/distance));pinch=distance;}updateCamera();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,e=>{pointers.delete(e.pointerId);pinch=0;}));
  canvas.addEventListener('wheel',e=>{e.preventDefault();orbit.zoom=Math.max(.7,Math.min(2,orbit.zoom*Math.exp(e.deltaY*.001)));updateCamera();},{passive:false});
  canvas.addEventListener('keydown',e=>{let used=true;switch(e.key){case'ArrowLeft':orbit.yaw-=.1;break;case'ArrowRight':orbit.yaw+=.1;break;case'ArrowUp':orbit.polar=Math.max(.03,orbit.polar-.1);break;case'ArrowDown':orbit.polar=Math.min(Math.PI-.03,orbit.polar+.1);break;case'+':case'=':orbit.zoom=Math.max(.7,orbit.zoom-.1);break;case'-':orbit.zoom=Math.min(2,orbit.zoom+.1);break;case'Home':view('perspective');break;default:used=false;}if(used){e.preventDefault();updateCamera();}});
  function placeLabels(){
    toy.model.updateMatrixWorld(true);const used=[];
    for(const {key,el} of labels){const anchor=toy.anchors[key];if(!anchor){el.style.display='none';continue;}const p=anchor.getWorldPosition(new THREE.Vector3()).project(camera);let x=(p.x*.5+.5)*host.clientWidth,y=(-p.y*.5+.5)*host.clientHeight;
      if(p.z>1||x<10||x>host.clientWidth-10||y<10||y>host.clientHeight-10){el.style.display='none';continue;}
      for(let i=0;i<5&&used.some(q=>Math.hypot(q.x-x,q.y-y)<31);i++){x+=i%2===0?26:-12;y+=18;}
      x=Math.max(17,Math.min(host.clientWidth-17,x));y=Math.max(48,Math.min(host.clientHeight-85,y));
      el.style.display='grid';el.style.left=x+'px';el.style.top=y+'px';used.push({x,y});
    }
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();state.playing=false;$('error').hidden=false;$('power-status').textContent='3D-контекст прерван';});
  document.addEventListener('visibilitychange',()=>lastTime=performance.now());
  function frame(now){const dt=(now-(lastTime||now))/1000;lastTime=now;if(!document.hidden)Orbit55Sequence.step(state,dt);apply();placeLabels();renderer.render(scene,camera);requestAnimationFrame(frame);}
  apply();requestAnimationFrame(frame);
})();
