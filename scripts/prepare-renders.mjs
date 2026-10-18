import {writeFileSync} from 'node:fs';
import {SCENES,PALETTES,VERTEX,fragmentFor} from '../dist/engine.js';
import {InfiniteCamera} from '../dist/navigation.js';
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const scenes=SCENES.map((s,i)=>{
 const camera=new InfiniteCamera(s.center,s.scale,s.angle),{coarse,fine,blend}=camera.layers();
 const width=960,height=540;
 const uniforms={u_resolution:[width,height],u_c:s.c,u_rotation:s.angle,u_emblem:s.emblem/100,u_relief:.65,u_phase:0,u_iterations:220,u_type:s.type,u_blend:blend};
 for(const[j,l]of[coarse,fine].entries()){uniforms['u_origin'+j]=l.origin;uniforms['u_scale'+j]=l.scale;uniforms['u_seed'+j]=((l.level%97+97)%97)*.173;}
 PALETTES[s.palette].colors.forEach((c,j)=>uniforms['u_p'+j]=rgb(c));
 return{fragment:'#version 120\n'+fragmentFor(s.type).replace('precision highp float;',''),file:String(i+1).padStart(2,'0'),width,height,uniforms};
});
writeFileSync(process.argv[2]||'/tmp/fractal-render-config.json',JSON.stringify({vertex:'#version 120\n'+VERTEX,scenes}));
