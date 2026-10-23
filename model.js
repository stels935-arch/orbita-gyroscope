(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.createOrbitGyro=factory;})(typeof globalThis!=='undefined'?globalThis:this,function(T){
 'use strict';
 // Millimetres; conceptual geometry. Balls are rigidly retained, NOT free rolling.
 const model=new T.Group();model.name='ORBIT gyro concept 280mm';const body=new T.Group();model.add(body);
 const mat=(c,m=.1,r=.4)=>new T.MeshStandardMaterial({color:c,metalness:m,roughness:r});
 const mats={frame:mat(0x27574f,.2),metal:mat(0xacc3c1,.65,.25),gold:mat(0xc0934e,.65,.28),red:mat(0xd4503e,.4,.22),blue:mat(0x237fa4,.4,.22)};
 const glass=new T.MeshPhysicalMaterial({color:0xafd7cf,transparent:true,opacity:.08,roughness:.18,side:T.DoubleSide,depthWrite:false});
 function mesh(g,m,p,name){const o=new T.Mesh(g,m);o.name=name;(p||body).add(o);return o;}
 function bar(a,b,r,m,p,name){const d=b.clone().sub(a),o=mesh(new T.CylinderGeometry(r,r,d.length(),16),m,p,name);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
 const shell=new T.Group();body.add(shell);const front=mesh(new T.SphereGeometry(140,56,32,0,Math.PI),glass,shell,'Front hemisphere'),back=mesh(new T.SphereGeometry(140,56,32,Math.PI,Math.PI),glass,shell,'Rear hemisphere');
 const seam=mesh(new T.TorusGeometry(139,1,10,100),mats.metal,shell,'Housing joint');
 const grip=mesh(new T.TorusGeometry(136,3,12,120),mats.frame,body,'Grip band');grip.rotation.x=Math.PI/2;
 for(let i=0;i<36;i++){const a=i*Math.PI/18,g=mesh(new T.SphereGeometry(1.7,8,6),mats.gold,body,'Grip');g.position.set(Math.cos(a)*137,0,Math.sin(a)*137);g.scale.y=1.5;}
 const race=new T.Group();body.add(race);for(const y of [-5,5]){const t=mesh(new T.TorusGeometry(126,1.3,10,128),mats.gold,race,'Contact race lip');t.rotation.x=Math.PI/2;t.position.y=y;}
 const guide=new T.Group();body.add(guide);const retainer=mesh(new T.TorusGeometry(124,1.3,10,100),mats.metal,guide,'Guide ring');retainer.rotation.x=Math.PI/2;
 for(const s of [-1,1]){const c=mesh(new T.TorusGeometry(5,1.5,10,24),mats.frame,guide,'Shaft guide');c.rotation.y=Math.PI/2;c.position.x=s*123;}
 const rotor=new T.Group();rotor.name='Single rotor with retained balls';guide.add(rotor);const wheel=mesh(new T.TorusGeometry(98,3,12,128),mats.frame,rotor,'Rotor hoop');wheel.rotation.y=Math.PI/2;
 bar(new T.Vector3(-127,0,0),new T.Vector3(127,0,0),3,mats.metal,rotor,'Shaft fixed to rotor');for(let i=0;i<4;i++){const a=i*Math.PI/2;bar(new T.Vector3(),new T.Vector3(0,Math.cos(a)*98,Math.sin(a)*98),2.4,mats.metal,rotor,'Spoke');}
 const hub=mesh(new T.CylinderGeometry(12,12,14,32),mats.gold,rotor,'Hub');hub.rotation.z=Math.PI/2;
 const balls=[];for(const [i,s] of [[0,1],[1,-1]]){const b=mesh(new T.SphereGeometry(10,32,20),i?mats.blue:mats.red,rotor,i?'Retained ball B':'Retained ball A');b.position.y=s*88;balls.push(b);const c=mesh(new T.TorusGeometry(9.2,1.7,10,32),mats.gold,rotor,'Ball retaining collar concept');c.rotation.x=Math.PI/2;c.position.y=s*88;}
 for(const s of [-1,1]){const e=mesh(new T.CylinderGeometry(3.2,3.2,5,20),mats.gold,rotor,'Shaft contact tip');e.rotation.z=Math.PI/2;e.position.x=s*125;}
 const axis=new T.Group();guide.add(axis);bar(new T.Vector3(-111,0,0),new T.Vector3(111,0,0),.65,mats.red,axis,'Illustrated spin axis');const arrow=mesh(new T.ConeGeometry(4,12,20),mats.red,axis,'Axis direction');arrow.rotation.z=-Math.PI/2;arrow.position.x=112;
 function setShell(mode){front.visible=mode==='full';back.visible=mode!=='none';seam.visible=mode!=='none';}
 function setPose(spin=.55,precession=.3,phase=0,hands=false){rotor.rotation.x=spin;guide.rotation.y=precession;body.rotation.set(hands?Math.sin(phase)*.16:0,0,hands?Math.cos(phase)*.16:0);}
 function reset(){setPose();}reset();return{model,body,shell,front,back,seam,race,guide,rotor,balls,axis,setShell,setPose,reset,diameter:280};
});
