import {writeFileSync} from 'node:fs';
import {SCENES,PALETTES,VERTEX,fragmentFor} from '../engine.js';
import {InfiniteCamera} from '../navigation.js';
import {dynamics,power,div} from '../fractal-math.js';
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const scenes=SCENES.map((s,i)=>{
 const camera=new InfiniteCamera(s.center,s.scale,s.angle,dynamics(s.type,s.c));
 const {center,scale,rotation,depth,model}=camera.frame(),width=640,height=360;
 const uniforms={u_resolution:[width,height],u_center:center,u_fixed:model.fixed,u_chartInverse:div([1,0],power(model.multiplier,Math.min(depth,24))),u_scale:scale,u_rotation:rotation,u_emblem:s.emblem/100,u_relief:.65,u_phase:0,u_iterations:220,u_type:s.type,u_degree:model.degree,u_depth:Math.min(depth,24),u_colorOffset:s.type>=8?depth%5:(depth%500)*.026,u_orbitOffset:Math.min(depth,64)};
 PALETTES[s.palette].colors.forEach((c,j)=>uniforms['u_p'+j]=rgb(c));
 return{fragment:'#version 120\n'+fragmentFor(s.type).replace('precision highp float;',''),file:String(i+1).padStart(2,'0'),width,height,uniforms};
});
writeFileSync(process.argv[2]||'/tmp/fractal-render-config.json',JSON.stringify({vertex:'#version 120\n'+VERTEX,scenes}));
