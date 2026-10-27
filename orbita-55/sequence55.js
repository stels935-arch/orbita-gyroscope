(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Orbit55Sequence=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const duration=12.5;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  function poseAt(time){
    const t=Math.max(0,Math.min(duration,time));
    const p={spin:.35,rollerSpin:-.35*6.4,azimuth:0,withdraw:1,pinLift:1,tiltX:0,tiltZ:0,motorPowered:false,stage:'start',phase:'align'};
    if(t<1){p.azimuth=.35*(1-ease(t));return p;}
    if(t<1.5){p.phase='lock';p.pinLift=1-ease((t-1)/.5);return p;}
    p.pinLift=0;
    if(t<2){p.phase='engage';p.withdraw=1-ease((t-1.5)/.5);return p;}
    p.spin=.35+Math.max(0,t-2)*2;
    p.rollerSpin=-6.4*(.35+Math.min(3,Math.max(0,t-2))*2);
    if(t<5){p.phase='spin';p.withdraw=0;p.motorPowered=true;return p;}
    p.stage='release';p.phase='withdraw';
    if(t<6){p.withdraw=ease(t-5);p.motorPowered=p.withdraw===0;return p;}
    p.withdraw=1;p.phase='unlock';
    if(t<6.5){p.pinLift=ease((t-6)/.5);return p;}
    p.pinLift=1;p.stage='hand';p.phase='hand';
    p.azimuth=(t-6.5)*.6;p.tiltX=Math.sin((t-6.5)*1.5)*.12;p.tiltZ=Math.sin((t-6.5)*1.5+.8)*.10;
    return p;
  }
  function create(){return{stage:'layout',time:0,playing:false,inCycle:false};}
  function select(s,stage){if(!['layout','start','release','hand'].includes(stage))throw Error('Unknown stage');s.stage=stage;s.playing=false;s.inCycle=false;s.time=0;return s;}
  function toggle(s){if(s.playing){s.playing=false;return s;}if(!s.inCycle||s.time>=duration){s.time=0;s.inCycle=true;}s.playing=true;return s;}
  function step(s,dt){if(!s.playing||!Number.isFinite(dt)||dt<=0)return s;s.time=Math.min(duration,s.time+Math.min(dt,.05));if(s.time>=duration)s.playing=false;return s;}
  function pose(s){
    if(s.inCycle)return poseAt(s.time);
    if(s.stage==='start')return poseAt(3.1);
    if(s.stage==='release')return{...poseAt(6),phase:'released',pinLift:0};
    if(s.stage==='hand')return poseAt(8.2);
    return{spin:.35,rollerSpin:-.35*6.4,azimuth:.35,withdraw:1,pinLift:1,tiltX:0,tiltZ:0,motorPowered:false,stage:'layout',phase:'layout'};
  }
  // The timeline is prescribed illustrative motion, not motor performance or a physical drive simulation.
  return{duration,create,select,toggle,step,pose,poseAt};
});
