import {InfiniteCamera} from './navigation.js?v=3';
import {dynamics,power,div} from './fractal-math.js?v=3';
export const PALETTES = [
  {name:'CRIMSON',colors:['#100c17','#a61540','#ffb6ab','#502049','#fff0d4'],swatches:['#de2858','#ffbeac','#33162f']},
  {name:'OCEAN',colors:['#041221','#11688c','#9cf5e6','#183c73','#e1fff5'],swatches:['#158ca1','#a6f3e2','#122744']},
  {name:'EMBER',colors:['#140b13','#ce3c17','#ffd579','#803047','#fff4ca'],swatches:['#ed5c24','#ffd078','#432136']},
  {name:'VIOLET',colors:['#120c24','#763ab6','#edc0ff','#333280','#fff0fd'],swatches:['#9860d9','#e8b3ef','#27214e']},
  {name:'JADE',colors:['#061a16','#27785a','#d6ee9a','#42614c','#f3f7d0'],swatches:['#519b6b','#d3e59c','#16392e']},
  {name:'COPPER',colors:['#17111a','#9d5638','#ebc7a5','#514457','#fff0db'],swatches:['#bd7a50','#eac5a3','#382a39']},
  {name:'ELECTRIC',colors:['#050c23','#164cca','#75d5ff','#5b20a2','#e7edff'],swatches:['#3772ef','#86d8ff','#36177b']},
  {name:'PRISM',colors:['#151425','#c45181','#eac27c','#398d91','#e5e7ff'],swatches:['#ce7195','#e7bd76','#58a2a2']},
  {name:'PEARL',colors:['#10151c','#547889','#d4e2dd','#79778c','#fff4df'],swatches:['#b8d3d2','#77788a','#e6d8c7']},
  {name:'GOLD',colors:['#11100c','#7e662d','#dace9b','#446a64','#fff4d4'],swatches:['#b5a16a','#e4d6a8','#41675d']}
];
export const GEOMETRIES=['Julia · спирали','Julia · ветвление','Julia z³','Julia z⁴','Julia z⁵','Julia z⁶','Julia z⁷','Julia z⁸','Vicsek · 3D','Menger · 3D'];
export const SCENES=[
  {name:'Crimson Lace',description:'Самоподобное кружево Julia',palette:0,c:[-.74543,.11301],center:[0,0],scale:.65,type:0,emblem:55,angle:-.15},
  {name:'Ocean Valley',description:'Бесконечные ветви Julia',palette:1,c:[-.8,.156],center:[0,0],scale:.7,type:1,emblem:30,angle:.2},
  {name:'Solar Flare',description:'Тройные огненные спирали',palette:2,c:[.45,.3],center:[0,0],scale:.7,type:2,emblem:35,angle:.12},
  {name:'Violet Mirror',description:'Четырёхлучевые разветвления',palette:3,c:[-.38,.48],center:[0,0],scale:.75,type:3,emblem:45,angle:.35},
  {name:'Jade Knot',description:'Пятилучевые переплетения',palette:4,c:[.42,.1],center:[0,0],scale:.75,type:4,emblem:65,angle:-.35},
  {name:'Copper Feather',description:'Шесть вложенных ветвей',palette:5,c:[-.2,.58],center:[0,0],scale:.8,type:5,emblem:40,angle:.2},
  {name:'Electric Bloom',description:'Семилучевые созвездия',palette:6,c:[-.61,.08],center:[0,0],scale:.8,type:6,emblem:50,angle:-.2},
  {name:'Prism Roots',description:'Восьмилучевые розетки',palette:7,c:[.12,.63],center:[0,0],scale:.8,type:7,emblem:35,angle:.1},
  {name:'Pearl Lattice',description:'Объёмный фрактал Вичека',palette:8,c:[0,0],center:[0,0],scale:.85,type:8,emblem:30,angle:0},
  {name:'Golden Labyrinth',description:'Самоподобная губка Менгера',palette:9,c:[0,0],center:[0,0],scale:.85,type:9,emblem:35,angle:0}
];
export const VERTEX=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
const COMMON=`precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution,u_center,u_fixed,u_chartInverse;
uniform float u_scale,u_rotation,u_emblem,u_relief,u_phase,u_colorOffset,u_orbitOffset;
uniform int u_iterations,u_type,u_degree,u_depth;
uniform vec3 u_p0,u_p1,u_p2,u_p3,u_p4;
const float PI=3.141592653589793;
vec2 mul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 unit(vec2 v){return v/max(length(v),1.e-30);}
float ellipse(vec2 p,vec2 r){return abs(length(p/r)-1.)*min(r.x,r.y);}
float emblem(vec2 p){return min(ellipse(p,vec2(.85,.56)),min(ellipse(p,vec2(.26,.56)),ellipse(p-vec2(0.,.21),vec2(.64,.24))));}
vec3 palette(float t){t=fract(t)*5.;if(t<1.)return mix(u_p0,u_p1,smoothstep(0.,1.,t));if(t<2.)return mix(u_p1,u_p2,smoothstep(0.,1.,t-1.));if(t<3.)return mix(u_p2,u_p3,smoothstep(0.,1.,t-2.));if(t<4.)return mix(u_p3,u_p4,smoothstep(0.,1.,t-3.));return mix(u_p4,u_p0,smoothstep(0.,1.,t-4.));}
vec2 screenPoint(){vec2 p=(v_uv*2.-1.)*vec2(u_resolution.x/u_resolution.y,1.);float c=cos(u_rotation),s=sin(u_rotation);return mat2(c,-s,s,c)*p;}
vec3 finish(vec3 c){return pow(max(c,vec3(0.)),vec3(.94));}
`;
const TWO_D=`
// Evaluate f(a+delta)-a around an exact repelling fixed point a.
// This factored polynomial retains tiny offsets instead of cancelling them.
vec2 stepOffset(vec2 delta){vec2 z=u_fixed+delta,sum=vec2(1.,0.),aPower=vec2(1.,0.);for(int j=1;j<8;j++){if(j>=u_degree)break;aPower=mul(aPower,u_fixed);sum=mul(sum,z)+aPower;}return mul(delta,sum);}
vec2 derivativeAt(vec2 z){vec2 p=vec2(1.,0.);for(int j=0;j<7;j++){if(j>=u_degree-1)break;p=mul(p,z);}return p*float(u_degree);}
vec3 field2D(vec2 q){
  vec2 delta=mul(q,u_chartInverse),derivative=unit(u_chartInverse),z=u_fixed+delta;
  float n=-float(u_depth);bool escaped=false;
  // Poincare linearization: L(k+1,lambda*q)=f(L(k,q)).
  // Every chart describes the SAME Julia set; no texture is blended in.
  for(int j=0;j<24;j++){
    if(j>=u_depth)break;
    derivative=unit(mul(derivativeAt(u_fixed+delta),derivative));delta=stepOffset(delta);n+=1.;z=u_fixed+delta;
    if(max(abs(z.x),abs(z.y))>64.){escaped=true;break;}
  }
  if(!escaped){for(int i=0;i<360;i++){
    if(i>=u_iterations)break;
    derivative=unit(mul(derivativeAt(u_fixed+delta),derivative));delta=stepOffset(delta);n+=1.;z=u_fixed+delta;
    if(max(abs(z.x),abs(z.y))>64.){escaped=true;break;}
  }}
  if(!escaped)return u_p0*.72;
  float logR=log(max(length(z),1.001));
  float smoothN=n+1.-log(logR)/log(float(u_degree));
  vec2 normal=unit(mul(mul(z,vec2(derivative.x,-derivative.y)),vec2(cos(u_rotation),sin(u_rotation))));
  float light=.67+.33*dot(normal,normalize(vec2(-.6,1.)));
  vec3 col=palette(smoothN*.026+u_colorOffset+u_phase);
  col*=mix(1.,.32+light*.9,u_relief);col+=u_p4*pow(max(light,0.),18.)*u_relief*.18;
  // An orbit coordinate pulls the same oval curves back into every branch.
  vec2 orbit=vec2(atan(z.y,z.x)/PI*1.15,fract(log(logR)/log(float(u_degree)))*1.6-.8);
  float ink=(1.-smoothstep(.007,.023,emblem(orbit)))*u_emblem*smoothstep(4.,18.,smoothN+u_orbitOffset);
  return mix(col,mix(u_p2,u_p4,.35),ink*.8);
}
void main(){vec2 q=u_center+screenPoint()*u_scale;gl_FragColor=vec4(finish(field2D(q)),1.);}
`;
const THREE_D=`
// Both volumes are fixed recursive sets, invariant under p -> 3*p.
// A change of camera scale reveals existing smaller cells of that same set.
float distanceField(vec3 p){
  float d=u_type==9?max(max(-p.x,-p.y),-p.z):-100000.;float cell=6561.;
  for(int i=0;i<20;i++){
    vec3 q=mod(p/cell+(u_type==8?vec3(1.5):vec3(0.)),3.);
    vec3 t=u_type==8?abs(q-1.5)-.5:.5-abs(q-1.5);
    float hole=max(min(t.x,t.y),max(min(t.x,t.z),min(t.y,t.z)))*cell;
    d=max(d,hole);cell/=3.;
  }
  return d;
}
vec3 field3D(vec2 screen){
  vec3 base=u_type==9?vec3(-3.2,2.6,3.8):vec3(3.2,2.6,3.8);
  vec3 forward=normalize(-base),right=normalize(cross(forward,vec3(0.,1.,0.))),up=cross(right,forward);
  vec3 ro=base*u_scale+right*u_center.x+up*u_center.y;
  vec3 rd=normalize(forward*2.8+right*screen.x+up*screen.y);
  float epsilon=max(.00002,u_scale/u_resolution.y*.7),t=0.;bool hit=false;
  for(int i=0;i<144;i++){float d=distanceField(ro+rd*t);if(d<epsilon){hit=true;break;}t+=max(d*.8,epsilon*.2);if(t>60.*u_scale)break;}
  if(!hit)return u_p0*.65;
  vec3 p=ro+rd*t;float e=epsilon*2.;
  vec3 normal=vec3(distanceField(p+vec3(e,0.,0.))-distanceField(p-vec3(e,0.,0.)),distanceField(p+vec3(0.,e,0.))-distanceField(p-vec3(0.,e,0.)),distanceField(p+vec3(0.,0.,e))-distanceField(p-vec3(0.,0.,e)));normal/=max(length(normal),1.e-20);
  vec3 light=normalize(vec3(-.5,.9,1.));float diffuse=max(dot(normal,light),0.);
  float ao=clamp(distanceField(p+normal*u_scale*.06)/(u_scale*.06),.4,1.);
  float spec=pow(max(dot(reflect(-light,normal),-rd),0.),24.);
  float radius=max(length(p),epsilon),cycle=log(radius)/log(3.);
  vec3 material=mix(u_p1,u_p2,.65+.25*sin((cycle-u_colorOffset)*1.256637+u_phase*6.283185));
  vec3 col=material*(.35+.65*diffuse)*ao+u_p4*spec*.38;
  vec2 oval=vec2(atan(p.y,p.x)/PI*1.2,fract(cycle)*1.6-.8);
  float line=(1.-smoothstep(.009,.025,emblem(oval)))*u_emblem;
  col=mix(col,u_p4*(.4+.6*diffuse),line*.65);
  return mix(col,u_p0,1.-exp(-t/u_scale*.018));
}
void main(){gl_FragColor=vec4(finish(field3D(screenPoint())),1.);}
`;
export const fragmentFor=type=>COMMON+(type>=8?THREE_D:TWO_D);
export const FRAGMENT=fragmentFor(0);
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export class FractalRenderer{
  constructor(canvas){
    this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
    if(!this.gl)throw new Error('WebGL недоступен');this.programs=new Map();this.modelKey='';
    const gl=this.gl,buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  }
  prepare(type){
    const key=type>=8?3:2;
    if(this.programs.has(key)){const entry=this.programs.get(key);this.program=entry.program;this.uniforms=entry.uniforms;return;}
    const gl=this.gl,shader=(kind,src)=>{const s=gl.createShader(kind);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const vs=shader(gl.VERTEX_SHADER,VERTEX),fs=shader(gl.FRAGMENT_SHADER,fragmentFor(type));this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.bindAttribLocation(this.program,0,'a_position');gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(this.program);
    this.uniforms={};['resolution','center','fixed','chartInverse','scale','rotation','emblem','relief','phase','colorOffset','orbitOffset','iterations','type','degree','depth','p0','p1','p2','p3','p4'].forEach(n=>this.uniforms[n]=gl.getUniformLocation(this.program,'u_'+n));
    this.programs.set(key,{program:this.program,uniforms:this.uniforms});
  }
  render(settings,camera){
    this.prepare(settings.type);
    if(!camera.frame)camera=new InfiniteCamera(camera.center,camera.scale,camera.angle,dynamics(settings.type,settings.c));
    const gl=this.gl,u=this.uniforms,{center,scale,rotation,depth,model}=camera.frame(),count=Math.min(depth,24);
    gl.useProgram(this.program);gl.viewport(0,0,this.canvas.width,this.canvas.height);
    gl.uniform2f(u.resolution,this.canvas.width,this.canvas.height);gl.uniform2fv(u.center,center);gl.uniform2fv(u.fixed,model.fixed);gl.uniform2fv(u.chartInverse,div([1,0],power(model.multiplier,count)));
    gl.uniform1f(u.scale,scale);gl.uniform1f(u.rotation,rotation);gl.uniform1f(u.emblem,settings.emblem/100);gl.uniform1f(u.relief,settings.relief/100);gl.uniform1f(u.phase,settings.phase||0);gl.uniform1f(u.colorOffset,settings.type>=8?depth%5:(depth%500)*.026);
    gl.uniform1f(u.orbitOffset,Math.min(depth,64));gl.uniform1i(u.iterations,settings.detail);gl.uniform1i(u.type,settings.type);gl.uniform1i(u.degree,model.degree);gl.uniform1i(u.depth,count);
    PALETTES[settings.palette].colors.forEach((hex,i)=>gl.uniform3fv(u['p'+i],rgb(hex)));gl.drawArrays(gl.TRIANGLES,0,6);
  }
}
