import {writeFileSync} from 'node:fs';
import {SCENES,VERTEX,fragmentFor,renderUniforms} from '../engine.js';
import {InfiniteCamera} from '../navigation.js';
import {dynamics} from '../fractal-math.js';
const verify=process.argv.includes('--verify-loop'),density=process.argv.includes('--verify-density'),scenes=[];
for(const[i,s]of SCENES.entries()){
 const camera=new InfiniteCamera([0,0],1,s.angle,dynamics(s.type,s.c));
 const settings={...s,detail:220,relief:s.relief??80,phase:0,samples:4};
 const width=verify||density?160:1280,height=verify||density?96:720;
 const shader='#version 120\n'+fragmentFor(s.type).replace('precision highp float;','');
 const append=(suffix='')=>scenes.push({fragment:shader,file:String(i+1).padStart(2,'0')+suffix,width,height,uniforms:renderUniforms(settings,camera,width,height)});
 if(verify){
  camera.zoom(s.type%2===0?.63:.51);append('-start');camera.zoom(1/camera.model.ratio);append('-repeat');
  camera.reset([0,0],1,s.angle);camera.zoom(Math.exp(-.000001*Math.log(camera.model.ratio)));append('-seam-after');
  camera.reset([0,0],1,s.angle);camera.zoom(Math.exp(-.999999*Math.log(camera.model.ratio)));append('-seam-before');
 }else if(density){for(let phase=0;phase<8;phase++){camera.reset([0,0],1,s.angle);camera.zoom(Math.exp(-phase/8*Math.log(camera.model.ratio)));append('-phase-'+phase);}}else append();
}
const output=process.argv.find((p,i)=>i>1&&!p.startsWith('--'))||'/tmp/fractal-render-config.json';
writeFileSync(output,JSON.stringify({vertex:'#version 120\n'+VERTEX,scenes}));
