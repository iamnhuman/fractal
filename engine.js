import {InfiniteCamera} from './navigation.js?v=5';
import {dynamics} from './fractal-math.js?v=5';
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
export const GEOMETRIES=['Спираль','Риф','Пламя','Зеркало','Узел','Перья','Кристалл','Мозаика','Вичек · 3D','Менгер · 3D'];
export const SCENES=[
  {name:'Crimson Lace',description:'Бесшовное спиральное кружево',palette:0,c:[-.74543,.11301],center:[0,0],scale:1,type:0,emblem:55,angle:-.15},
  {name:'Ocean Valley',description:'Вложенные волны и рифы',palette:1,c:[-.8,.156],center:[0,0],scale:1,type:1,emblem:30,angle:.2},
  {name:'Solar Flare',description:'Огненная тройная спираль',palette:2,c:[.45,.3],center:[0,0],scale:1,type:2,emblem:35,angle:.12},
  {name:'Violet Mirror',description:'Зеркальная восьмилучевая розетка',palette:3,c:[-.38,.48],center:[0,0],scale:1,type:3,emblem:45,angle:.35},
  {name:'Jade Knot',description:'Пять переплетённых спиралей',palette:4,c:[.42,.1],center:[0,0],scale:1,type:4,emblem:65,angle:-.35},
  {name:'Copper Feather',description:'Двойной медный вихрь',palette:5,c:[-.2,.58],center:[0,0],scale:1,type:5,emblem:40,angle:.2},
  {name:'Electric Bloom',description:'Двенадцатилучевые кристаллы',palette:6,c:[-.61,.08],center:[0,0],scale:1,type:6,emblem:50,angle:-.2},
  {name:'Prism Roots',description:'Призматическая шестилучевая мозаика',palette:7,c:[.12,.63],center:[0,0],scale:1,type:7,emblem:35,angle:.1},
  {name:'Pearl Lattice',description:'Объёмный фрактал Вичека',palette:8,c:[0,0],center:[0,0],scale:1,type:8,emblem:30,angle:0},
  {name:'Golden Labyrinth',description:'Самоподобная губка Менгера',palette:9,c:[0,0],center:[0,0],scale:1,type:9,emblem:35,angle:0}
];
export const VERTEX=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
const COMMON=`precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution,u_seed;
uniform vec4 u_loop,u_shape;
uniform float u_zoomPhase,u_rotation,u_emblem,u_relief,u_phase;
uniform int u_iterations,u_type;
uniform vec3 u_p0,u_p1,u_p2,u_p3,u_p4;
const float PI=3.141592653589793;
const float TAU=6.283185307179586;
float ellipse(vec2 p,vec2 r){return abs(length(p/r)-1.)*min(r.x,r.y);}
float emblem(vec2 p){return min(ellipse(p,vec2(.85,.56)),min(ellipse(p,vec2(.26,.56)),ellipse(p-vec2(0.,.21),vec2(.64,.24))));}
vec3 palette(float t){t=fract(t)*5.;if(t<1.)return mix(u_p0,u_p1,smoothstep(0.,1.,t));if(t<2.)return mix(u_p1,u_p2,smoothstep(0.,1.,t-1.));if(t<3.)return mix(u_p2,u_p3,smoothstep(0.,1.,t-2.));if(t<4.)return mix(u_p3,u_p4,smoothstep(0.,1.,t-3.));return mix(u_p4,u_p0,smoothstep(0.,1.,t-4.));}
vec2 screenPoint(){vec2 p=(v_uv*2.-1.)*vec2(u_resolution.x/u_resolution.y,1.);float c=cos(u_rotation),s=sin(u_rotation);return mat2(c,-s,s,c)*p;}
// A single smooth torus map, shared by all scales and all modes.
// log(r*ratio)/log(ratio) = log(r)/log(ratio)+1, so the WHOLE frame repeats.
// Only sin/cos of the periodic coordinates enter the geometry; ring boundaries join.
vec2 loopCoordinates(vec2 p){
  float radius=max(length(p),1.e-12),angle=atan(p.y,p.x);
  float u=TAU*fract(log(radius)/u_loop.x-u_zoomPhase);
  float v=u_loop.y*angle+u_loop.z*u;u+=u_loop.w*sin(v);
  return vec2(.95*cos(u)+.6*cos(v)+.13*sin(2.*v-u),.95*sin(u)+.6*sin(v)+.13*cos(2.*u+v));
}
vec3 patternMeasure(vec2 p){
  vec2 z=p*.72+u_seed;float derivative=1.,trap=10.,rings=0.,weight=1.;
  float c=cos(u_shape.y),s=sin(u_shape.y);
  for(int i=0;i<12;i++){
    if(i>=u_iterations)break;
    if(u_type==2||u_type==5)z=abs(z)-vec2(0.,.42);
    if(u_type==3||u_type==7){z=abs(z);if(z.y>z.x)z=z.yx;z-=vec2(.3,.12);}
    z=2.*clamp(z,vec2(-u_shape.z),vec2(u_shape.z))-z;
    float r2=dot(z,z),fold=clamp(1./max(r2,.04),1.,5.);z*=fold;derivative*=fold;
    z=mat2(c,s,-s,c)*z*u_shape.x+p*.55+u_seed;
    derivative=derivative*abs(u_shape.x)+1.;
    trap=min(trap,abs(z.x)+.3*abs(z.y));rings+=exp(-3.*abs(r2-.7))*weight;weight*=.7;
  }
  float distance=length(z)/max(derivative,.001);
  return vec3(-log(max(distance,1.e-16))*.052+trap*.17+rings*.045,trap,distance);
}
vec3 patternShade(vec2 p){
  vec3 m=patternMeasure(p);
  float dx=patternMeasure(p+vec2(.002,0.)).x-m.x,dy=patternMeasure(p+vec2(0.,.002)).x-m.x;
  vec3 normal=normalize(vec3(-dx,-dy,.03));float light=.65+.35*dot(normal,normalize(vec3(-.5,.7,1.)));
  vec3 col=mix(palette(m.x+u_phase),u_p2,.12);
  col*=mix(1.,.45+light*.75,u_relief);col+=u_p4*exp(-14.*m.y)*.1;
  float ink=(1.-smoothstep(.008,.023,emblem(p*1.1)))*u_emblem;
  return mix(col,u_p4*(.6+.4*light),ink*.36);
}
vec3 finish(vec3 c){return pow(max(c,vec3(0.)),vec3(.94));}
`;
const TWO_D=`
vec3 field2D(vec2 p){return patternShade(p);}
void main(){gl_FragColor=vec4(finish(field2D(loopCoordinates(screenPoint()))),1.);}
`;
const THREE_D=`
float distanceField(vec3 p){
  vec3 q=abs(p)-1.;float d=length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.),s=1.;
  for(int i=0;i<7;i++){
    vec3 a=mod((p+1.)*s,2.)-1.,t=u_type==8?abs(a)-1./3.:1./3.-abs(a);
    d=max(d,max(min(t.x,t.y),max(min(t.x,t.z),min(t.y,t.z)))/s);s*=3.;
  }
  return d;
}
vec3 field3D(vec2 screen){
  vec3 base=u_type==9?vec3(-3.2,2.6,3.8):vec3(3.2,2.6,3.8);
  vec3 forward=normalize(-base),right=normalize(cross(forward,vec3(0.,1.,0.))),up=cross(right,forward);
  vec3 ro=base*.7,rd=normalize(forward*2.8+right*screen.x*.85+up*screen.y*.85);
  float epsilon=.0009,t=0.;bool hit=false;
  for(int i=0;i<112;i++){float d=distanceField(ro+rd*t);if(d<epsilon){hit=true;break;}t+=max(d*.8,epsilon*.2);if(t>35.)break;}
  vec3 background=patternShade(screen);
  if(!hit)return background*.85;
  vec3 p=ro+rd*t;float e=epsilon*2.;
  vec3 normal=vec3(distanceField(p+vec3(e,0.,0.))-distanceField(p-vec3(e,0.,0.)),distanceField(p+vec3(0.,e,0.))-distanceField(p-vec3(0.,e,0.)),distanceField(p+vec3(0.,0.,e))-distanceField(p-vec3(0.,0.,e)));normal/=max(length(normal),1.e-20);
  vec3 light=normalize(vec3(-.5,.9,1.));float diffuse=max(dot(normal,light),0.);
  float ao=clamp(distanceField(p+normal*.045)/.045,.4,1.);
  float spec=pow(max(dot(reflect(-light,normal),-rd),0.),24.);
  vec3 material=mix(u_p1,u_p2,.65+.25*sin(log(max(length(p),.001))*2.4+u_phase*TAU));
  vec3 col=material*(.35+.65*diffuse)*ao+u_p4*spec*.38;
  col=mix(col,u_p4*(.4+.6*diffuse),(1.-smoothstep(.009,.025,emblem(screen*.9)))*u_emblem*.35);
  return mix(col,background,1.-exp(-t*.022));
}
void main(){gl_FragColor=vec4(finish(field3D(loopCoordinates(screenPoint()))),1.);}
`;
export const fragmentFor=type=>COMMON+(type>=8?THREE_D:TWO_D);
export const FRAGMENT=fragmentFor(0);
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export function renderUniforms(settings,camera,width,height){
  const {phase,rotation,model:m}=camera.frame();
  const u={u_resolution:[width,height],u_seed:m.seed,u_loop:[Math.log(m.ratio),m.spokes,m.twist,m.warp],u_shape:[m.stretch,m.spin,m.box,0],u_zoomPhase:phase,u_rotation:rotation,u_emblem:settings.emblem/100,u_relief:settings.relief/100,u_phase:settings.phase||0,u_iterations:Math.max(5,Math.min(12,Math.round(settings.detail/32))),u_type:settings.type};
  PALETTES[settings.palette].colors.forEach((color,i)=>u['u_p'+i]=rgb(color));return u;
}
export class FractalRenderer{
  constructor(canvas){
    this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
    if(!this.gl)throw new Error('WebGL недоступен');this.programs=new Map();
    const gl=this.gl,buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  }
  prepare(type){
    const key=type>=8?3:2;
    if(this.programs.has(key)){const entry=this.programs.get(key);this.program=entry.program;this.uniforms=entry.uniforms;return;}
    const gl=this.gl,shader=(kind,src)=>{const s=gl.createShader(kind);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const vs=shader(gl.VERTEX_SHADER,VERTEX),fs=shader(gl.FRAGMENT_SHADER,fragmentFor(type));this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.bindAttribLocation(this.program,0,'a_position');gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));gl.deleteShader(vs);gl.deleteShader(fs);
    this.uniforms={};for(const name of ['resolution','seed','loop','shape','zoomPhase','rotation','emblem','relief','phase','iterations','type','p0','p1','p2','p3','p4'])this.uniforms['u_'+name]=gl.getUniformLocation(this.program,'u_'+name);
    this.programs.set(key,{program:this.program,uniforms:this.uniforms});
  }
  render(settings,camera){
    this.prepare(settings.type);
    if(!camera.frame)camera=new InfiniteCamera([0,0],1,camera.angle,dynamics(settings.type,settings.c));
    const gl=this.gl;gl.useProgram(this.program);gl.viewport(0,0,this.canvas.width,this.canvas.height);
    for(const[name,value]of Object.entries(renderUniforms(settings,camera,this.canvas.width,this.canvas.height))){const u=this.uniforms[name];if(Array.isArray(value)){if(value.length===2)gl.uniform2fv(u,value);else if(value.length===3)gl.uniform3fv(u,value);else gl.uniform4fv(u,value);}else if(name==='u_type'||name==='u_iterations')gl.uniform1i(u,value);else gl.uniform1f(u,value);}
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
}
