import test from 'node:test';
import assert from 'node:assert/strict';
import {InfiniteCamera} from '../navigation.js';
import {SCENES,GEOMETRIES,renderUniforms,is3D} from '../engine.js';
import {dynamics,loopCoordinates,patternMeasure,volumeDistance,volumeView} from '../fractal-math.js';
import {classicPoint,classicMeasure} from '../classic.js';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const makeCamera=s=>new InfiniteCamera([0,0],1,s.angle,dynamics(s.type,s.c));
const settings=s=>({...s,detail:220,relief:65,phase:0});
const gpuValues=u=>Object.fromEntries(Object.entries(u).map(([name,value])=>[name,Array.isArray(value)?Array.from(new Float32Array(value)):Math.fround(value)]));
test('ten distinct recipes, including four volume modes',()=>{assert.equal(SCENES.length,10);assert.equal(new Set(SCENES.map(s=>s.type)).size,10);assert.equal(GEOMETRIES.length,10);assert.equal(SCENES.filter(s=>is3D(s.type)).length,4);});
test('the original four Julia families retain their seeds and repelling period-four orbits',()=>{
 const seeds=[[-.74543,.11301],[-.8,.156],[-.7269,.1889],[-.4,.6]];
 for(const [i,s] of SCENES.slice(0,4).entries()){
  assert.deepEqual(s.c,seeds[i]);const m=dynamics(s.type,s.c);assert.ok(m.classic&&m.ratio>2);
  m.cycle.forEach(([x,y],j)=>{const next=m.cycle[(j+1)%4];near(x*x-y*y+s.c[0],next[0],2e-6);near(2*x*y+s.c[1],next[1],2e-6);});
 }
});
test('a complete zoom period repeats ALL shader inputs, including geometry, palette, light and emblems',()=>{
 for(const s of SCENES)for(const phase of [0,.137,.5,.913]){
  const camera=makeCamera(s);camera.zoom(Math.exp(-phase*Math.log(camera.model.ratio)));
  const before=gpuValues(renderUniforms(settings(s),camera,1280,720));camera.zoom(1/camera.model.ratio);
  assert.deepEqual(gpuValues(renderUniforms(settings(s),camera,1280,720)),before,s.name);
 }
});
test('nested copies share one coordinate map at every radius',()=>{
 for(const s of SCENES){const m=dynamics(s.type,s.c);for(let i=1;i<=60;i++){
  const p=[Math.sin(i*2.1)*(i+.1)/23,Math.cos(i*.71)*(i+.7)/31];
  if(m.classic){
   const a=classicPoint(p,m,.327),b=classicPoint(p.map(x=>x/m.ratio),m,-.673),scale=Math.hypot(...a);
   a.forEach((v,j)=>near(v/scale,b[j]/scale,1e-10));
  }else{const a=loopCoordinates(p,m,.327),b=loopCoordinates(p.map(x=>x*m.ratio),m,.327);a.forEach((v,j)=>near(v,b[j],1e-9));}
 }}
});
test('the log-radius seam and the angle seam join continuously',()=>{
 for(const s of SCENES.filter(s=>s.type>=4)){const m=dynamics(s.type,s.c),p=[.47,-.28],a=loopCoordinates(p,m,1-1e-9),b=loopCoordinates(p,m,-1e-9);a.forEach((v,i)=>near(v,b[i],1e-7));
  const left=loopCoordinates([-1,-1e-10],m,.2),right=loopCoordinates([-1,1e-10],m,.2);left.forEach((v,i)=>near(v,right[i],1e-7));
 }
});
test('intermediate magnifications move the existing pattern, rather than freezing the image',()=>{
 for(const s of SCENES){const m=dynamics(s.type,s.c),coordinates=m.classic?classicPoint:loopCoordinates,a=coordinates([.7,.22],m,0),b=coordinates([.7,.22],m,.21);assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])/Math.hypot(...a)>.01,s.name);}
});
test('2D escape potentials stay finite and varied throughout the zoom cycle',()=>{
 for(const s of SCENES.filter(s=>!is3D(s.type)))for(const phase of [0,.17,.33,.5,.67,.83]){
  const m=dynamics(s.type,s.c),values=[];
  for(let y=0;y<18;y++)for(let x=0;x<32;x++){
   const point=[((x+.5)/32*2-1)*16/9,1-(y+.5)/18*2],measure=m.classic?classicMeasure(point,m,phase,220):patternMeasure(loopCoordinates(point,m,phase),m,220);
   assert.ok(measure.every(Number.isFinite),s.name);values.push(measure[0]);
  }
  const mean=values.reduce((a,b)=>a+b)/values.length,variance=values.reduce((a,b)=>a+(b-mean)**2,0)/values.length;
  assert.ok(variance>1e-5,`${s.name}: no structure at phase ${phase}`);
 }
});
test('Julia escape colouring joins the next scale without changing the branches',()=>{
 for(const s of SCENES.slice(0,4)){
  const m=dynamics(s.type,s.c);let error=0;
  for(let i=1;i<=80;i++){
   const p=[Math.sin(i*.71)*1.7,Math.cos(i*1.13)],a=classicMeasure(p,m,0),b=classicMeasure(p,m,1);
   error+=Math.abs(a[0]-b[0]);
  }
  assert.ok(error/80<.001,s.name);
 }
});
test('the actual 3D field scales continuously with the camera, including shell boundaries',()=>{
 for(const s of SCENES.filter(s=>is3D(s.type))){
  const model=dynamics(s.type,s.c);
  for(let i=1;i<=150;i++){
   const point=[Math.sin(i*.81)*2,Math.cos(i*.37)*2,Math.sin(i*1.31)*3+.3];
   const a=volumeDistance(point,model),b=volumeDistance(point.map(v=>v*model.ratio),model);
   near(a,b/model.ratio,1e-8);
  }
  for(const radius of [1,model.ratio,1/model.ratio]){
   const before=volumeDistance([radius*(1-1e-9),0,0],model),after=volumeDistance([radius*(1+1e-9),0,0],model);
   near(before,after,1e-6);
  }
 }
});
test('zoom never stops or underflows, in either direction',()=>{
 const camera=makeCamera(SCENES[0]);
 for(let i=0;i<7000;i++)camera.zoom(.7);
 assert.ok(camera.logZoom/Math.LN10>1000);assert.ok(Number.isFinite(camera.scale));assert.ok(camera.scale>0);assert.ok(!camera.zoomLabel.includes('Infinity'));
 for(let i=0;i<14000;i++)camera.zoom(1/.7);
 assert.ok(camera.logZoom/Math.LN10< -1000);assert.ok(Number.isFinite(camera.scale));assert.ok(camera.scale>0);
});
test('manual zoom, pinch anchors and flight cannot move the locked centre',()=>{
 const camera=new InfiniteCamera([2,-4]);assert.deepEqual(camera.center,[0,0]);assert.equal(camera.pan,undefined);
 for(let i=0;i<300;i++){camera.zoom(.8,[i,-i]);camera.fly(1/30);assert.deepEqual(camera.frame().center,[0,0]);}
});
test('reverse zoom restores the complete original frame',()=>{
 const s=SCENES[0],camera=makeCamera(s),before=gpuValues(renderUniforms(settings(s),camera,1280,720));
 for(let i=0;i<90;i++)camera.zoom(.7);for(let i=0;i<90;i++)camera.zoom(1/.7);
 near(camera.logZoom,0,1e-9);assert.deepEqual(gpuValues(renderUniforms(settings(s),camera,1280,720)),before);
});

test('every 3D camera path stays outside solid geometry for the complete loop',()=>{
 for(const s of SCENES.filter(s=>is3D(s.type))){
  const model=dynamics(s.type,s.c),view=volumeView(s.type);
  for(let i=0;i<=128;i++){
   const scale=model.ratio**(-i/128),point=view.map(v=>v*scale);
   assert.ok(volumeDistance(point,model)>scale*.00035,`${s.name}: camera inside a solid at phase ${i/128}`);
  }
 }
});
