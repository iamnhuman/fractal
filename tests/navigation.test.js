import test from 'node:test';
import assert from 'node:assert/strict';
import {InfiniteCamera} from '../navigation.js';
import {SCENES,GEOMETRIES,renderUniforms} from '../engine.js';
import {dynamics,loopCoordinates,patternMeasure,volumeDistance} from '../fractal-math.js';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const makeCamera=s=>new InfiniteCamera([0,0],1,s.angle,dynamics(s.type,s.c));
const settings=s=>({...s,detail:220,relief:65,phase:0});
const gpuValues=u=>Object.fromEntries(Object.entries(u).map(([name,value])=>[name,Array.isArray(value)?Array.from(new Float32Array(value)):Math.fround(value)]));
test('ten distinct recipes, including four volume modes',()=>{assert.equal(SCENES.length,10);assert.equal(new Set(SCENES.map(s=>s.type)).size,10);assert.equal(GEOMETRIES.length,10);assert.equal(SCENES.filter(s=>s.type>=6).length,4);});
test('a complete zoom period repeats ALL shader inputs, including geometry, palette, light and emblems',()=>{
 for(const s of SCENES)for(const phase of [0,.137,.5,.913]){
  const camera=makeCamera(s);camera.zoom(Math.exp(-phase*Math.log(camera.model.ratio)));
  const before=gpuValues(renderUniforms(settings(s),camera,1280,720));camera.zoom(1/camera.model.ratio);
  assert.deepEqual(gpuValues(renderUniforms(settings(s),camera,1280,720)),before,s.name);
 }
});
test('nested copies share one coordinate map at every radius',()=>{
 for(const s of SCENES){const m=dynamics(s.type,s.c);for(let i=1;i<=60;i++){
  const p=[Math.sin(i*2.1)*(i+.1)/23,Math.cos(i*.71)*(i+.7)/31],a=loopCoordinates(p,m,.327),b=loopCoordinates(p.map(x=>x*m.ratio),m,.327);
  a.forEach((v,j)=>near(v,b[j],1e-9));
 }}
});
test('the log-radius seam and the angle seam join continuously',()=>{
 for(const s of SCENES){const m=dynamics(s.type,s.c),p=[.47,-.28],a=loopCoordinates(p,m,1-1e-9),b=loopCoordinates(p,m,-1e-9);a.forEach((v,i)=>near(v,b[i],1e-7));
  const left=loopCoordinates([-1,-1e-10],m,.2),right=loopCoordinates([-1,1e-10],m,.2);left.forEach((v,i)=>near(v,right[i],1e-7));
 }
});
test('intermediate magnifications move the existing pattern, rather than freezing the image',()=>{
 for(const s of SCENES){const m=dynamics(s.type,s.c),a=loopCoordinates([.7,.22],m,0),b=loopCoordinates([.7,.22],m,.21);assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])>.01,s.name);}
});
test('Julia escape potential stays finite and varied throughout the zoom cycle',()=>{
 for(const s of SCENES.filter(s=>s.type<6))for(const phase of [0,.17,.33,.5,.67,.83]){
  const m=dynamics(s.type,s.c),values=[];
  for(let y=0;y<18;y++)for(let x=0;x<32;x++){
   const point=[((x+.5)/32*2-1)*16/9,1-(y+.5)/18*2],measure=patternMeasure(loopCoordinates(point,m,phase),m,220);
   assert.ok(measure.every(Number.isFinite),s.name);values.push(measure[0]);
  }
  const mean=values.reduce((a,b)=>a+b)/values.length,variance=values.reduce((a,b)=>a+(b-mean)**2,0)/values.length;
  assert.ok(variance>1e-5,`${s.name}: no structure at phase ${phase}`);
 }
});
test('the actual 3D field scales continuously with the camera, including shell boundaries',()=>{
 for(const s of SCENES.filter(s=>s.type>=6)){
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
