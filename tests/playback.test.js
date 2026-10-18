// Run the real application and its event handlers in a small DOM stub.
// This tests playback state and camera motion, without a browser or GPU.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {SCENES,PALETTES,GEOMETRIES,is3D} from '../engine.js';
import {InfiniteCamera} from '../navigation.js';
import {dynamics} from '../fractal-math.js';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
class Element{
 constructor(){this.children=[];this.listeners={};this.attributes={};this.style={setProperty(){}};this.classList={toggle(){},add(){},remove(){}};this.clientWidth=960;this.clientHeight=540;this.min=0;this.max=100;this.nodes={};this.value=0;}
 append(node){this.children.push(node);}
 addEventListener(name,callback){this.listeners[name]=callback;}
 setAttribute(name,value){this.attributes[name]=value;}
 querySelector(name){return this.nodes[name]??=new Element();}
 getBoundingClientRect(){return{width:960,height:540};}
 setPointerCapture(){}
 fire(name,event={}){this.listeners[name]?.({preventDefault(){},...event});}
}
function application({observer=true}={}){
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
 const document={hidden:false,getElementById:get,createElement:()=>new Element(),addEventListener(){},querySelector:()=>new Element(),querySelectorAll:selector=>selector==='.scene'?get('scenes').children:selector==='.palette'?get('palettes').children:[]};
 const frames=[];let clock=0,draws=0;
 class Renderer{constructor(canvas){this.canvas=canvas;}render(){draws++;}}
 const window={innerWidth:1400,innerHeight:900,devicePixelRatio:1,addEventListener(){}};
 const context=vm.createContext({document,window,SCENES,PALETTES,GEOMETRIES,is3D,InfiniteCamera,dynamics,FractalRenderer:Renderer,HTMLCanvasElement:class{},ResizeObserver:observer?class{observe(){}}:undefined,performance:{now:()=>clock},requestAnimationFrame:callback=>frames.push(callback),setTimeout(){},clearTimeout(){},console});
 vm.runInContext(source,context);
 return{get,state:()=>window.fractalStudio.getState(),draws:()=>draws,advance(ms=1000){for(let i=0;i<ms/20;i++){clock+=20;const frame=frames.shift();assert.ok(frame,'animation frame scheduled');frame(clock);}}};
}
test('opening the app starts visible camera motion without clicks',()=>{
 const app=application();assert.equal(app.state().playing,true);assert.equal(app.get('playButton').attributes['aria-pressed'],'true');
 const zoom=app.state().camera.level+app.state().camera.phase;app.advance();
 assert.ok(app.state().camera.level+app.state().camera.phase>zoom+.15);assert.ok(app.draws()>40);
 assert.equal(app.state().settings.speed,1.3);
});
test('wheel and pinch zoom preserve automatic flight',()=>{
 const app=application();app.get('fractal').fire('wheel',{deltaY:-60});assert.equal(app.state().playing,true);
 app.get('fractal').fire('pointerdown',{pointerType:'touch',pointerId:1,clientX:0,clientY:0});
 app.get('fractal').fire('pointerdown',{pointerType:'touch',pointerId:2,clientX:100,clientY:0});
 app.get('fractal').fire('pointermove',{pointerId:2,clientX:120,clientY:0});assert.equal(app.state().playing,true);
 const phase=app.state().camera.phase;app.advance(200);assert.notEqual(app.state().camera.phase,phase);
});
test('pause is explicit and choosing another scene starts that scene immediately',()=>{
 const app=application();app.get('playButton').fire('click');assert.equal(app.state().playing,false);
 const before=app.state().camera.phase;app.advance(200);assert.equal(app.state().camera.phase,before);
 for(const button of app.get('scenes').children){button.fire('click');assert.equal(app.state().playing,true);app.advance(200);assert.ok(app.state().camera.phase>0);}
});

test('optional layout observers cannot prevent the animation from starting',()=>{
 const app=application({observer:false});app.advance(200);assert.equal(app.state().playing,true);assert.ok(app.state().camera.phase>0);assert.ok(app.draws()>5);
});
test('restoring WebGL resumes automatic motion without another click',()=>{
 const app=application();app.advance(200);app.get('fractal').fire('webglcontextlost');const phase=app.state().camera.phase;
 app.advance(200);assert.equal(app.state().camera.phase,phase);assert.equal(app.state().renderAvailable,false);
 app.get('fractal').fire('webglcontextrestored');app.advance(200);assert.equal(app.state().renderAvailable,true);assert.notEqual(app.state().camera.phase,phase);
});
