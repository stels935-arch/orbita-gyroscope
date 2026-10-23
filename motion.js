(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GyroMotion=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 // Prescribed animation, NOT a calculation of the wrist-powered drive or gyroscopic reaction.
 function create(){return{spin:.55,precession:.3,phase:0,playing:false,hands:false,speed:1};}
 function step(s,dt){if(!s.playing||!Number.isFinite(dt)||dt<=0)return s;const d=Math.min(dt,.05)*s.speed,tau=Math.PI*2;s.spin=(s.spin+d*2.8)%tau;if(s.hands){s.precession=(s.precession+d*.38)%tau;s.phase=(s.phase+d*1.4)%tau;}return s;}
 return{create,step};
});
