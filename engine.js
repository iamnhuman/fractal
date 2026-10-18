import {InfiniteCamera} from './navigation.js?v=6';
import {dynamics} from './fractal-math.js?v=6';
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
export const GEOMETRIES=['Спираль Julia','Риф Julia','Пламя z³','Зеркало z⁴','Ньютон · переплетение','Медные перья','Мандельбульб · 3D','Мандельбокс · 3D','Вичек · 3D','Менгер · 3D'];
export const SCENES=[
  {name:'Crimson Lace',description:'Три атласные спирали и тонкое кружево',palette:0,c:[-.835,-.2321],center:[0,0],scale:1,type:0,emblem:55,angle:-.15},
  {name:'Ocean Valley',description:'Вложенные волны и рифы',palette:1,c:[-.70176,-.3842],center:[0,0],scale:1,type:1,emblem:30,angle:.2},
  {name:'Solar Flare',description:'Огненная тройная спираль',palette:2,c:[.45,.3],center:[0,0],scale:1,type:2,emblem:35,angle:.12},
  {name:'Violet Mirror',description:'Зеркальная восьмилучевая розетка',palette:3,c:[-.38,.48],center:[0,0],scale:1,type:3,emblem:45,angle:.35},
  {name:'Jade Knot',description:'Нефритовые переплетения фрактала Ньютона',palette:4,c:[.42,.1],center:[0,0],scale:1,type:4,emblem:65,angle:-.35},
  {name:'Copper Feather',description:'Медные перья и вложенные завитки',palette:5,c:[-.4,.6],center:[0,0],scale:1,type:5,emblem:40,angle:.2},
  {name:'Electric Bloom',description:'Скульптурный мандельбульб · 3D',palette:6,c:[-.61,.08],center:[0,0],scale:1,type:6,emblem:50,angle:-.2},
  {name:'Prism Roots',description:'Объёмная архитектура мандельбокса · 3D',palette:7,c:[.12,.63],center:[0,0],scale:1,type:7,emblem:35,angle:.1},
  {name:'Pearl Lattice',description:'Объёмный фрактал Вичека',palette:8,c:[0,0],center:[0,0],scale:1,type:8,emblem:30,angle:0},
  {name:'Golden Labyrinth',description:'Самоподобная губка Менгера',palette:9,c:[0,0],center:[0,0],scale:1,type:9,emblem:35,angle:0}
];
export const VERTEX=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
const COMMON=`precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution,u_seed;
uniform vec4 u_loop;
uniform float u_zoomPhase,u_rotation,u_emblem,u_relief,u_phase;
uniform int u_iterations,u_type,u_samples;
uniform vec3 u_p0,u_p1,u_p2,u_p3,u_p4;
const float PI=3.141592653589793;
const float TAU=6.283185307179586;
vec2 rotate(vec2 p,float a){float c=cos(a),s=sin(a);return vec2(c*p.x-s*p.y,s*p.x+c*p.y);}
float ellipse(vec2 p,vec2 r){return abs(length(p/r)-1.)*min(r.x,r.y);}
float emblem(vec2 p){return min(ellipse(p,vec2(.85,.56)),min(ellipse(p,vec2(.26,.56)),ellipse(p-vec2(0.,.21),vec2(.64,.24))));}
vec3 palette(float t){t=fract(t)*5.;if(t<1.)return mix(u_p0,u_p1,smoothstep(0.,1.,t));if(t<2.)return mix(u_p1,u_p2,smoothstep(0.,1.,t-1.));if(t<3.)return mix(u_p2,u_p3,smoothstep(0.,1.,t-2.));if(t<4.)return mix(u_p3,u_p4,smoothstep(0.,1.,t-3.));return mix(u_p4,u_p0,smoothstep(0.,1.,t-4.));}
vec2 screenPoint(vec2 offset){return rotate(((v_uv+offset/u_resolution)*2.-1.)*vec2(u_resolution.x/u_resolution.y,1.),-u_rotation);}
// All radial and angular boundaries close analytically, without cross-fading images.
vec2 loopCoordinates(vec2 p){
  float radius=max(length(p),1.e-12),angle=atan(p.y,p.x);
  float u=TAU*fract(log(radius)/u_loop.x-u_zoomPhase);
  float v=u_loop.y*angle+u_loop.z*u;u+=u_loop.w*sin(v);
  return vec2(.95*cos(u)+.6*cos(v)+.13*sin(2.*v-u),.95*sin(u)+.6*sin(v)+.13*cos(2.*u+v));
}
vec3 finish(vec3 c){return pow(max(c,vec3(0.)),vec3(.94));}
`;
const TWO_D=`
vec2 multiply(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 divide(vec2 a,vec2 b){return multiply(a,vec2(b.x,-b.y))/max(dot(b,b),1.e-20);}
vec3 newton(vec2 p){
  vec2 z=p,derivative=vec2(1.,0.),normal=vec2(1.,0.);float steps=0.,error=1.;
  for(int i=0;i<48;i++){
    if(i>=u_iterations/8)break;
    vec2 square=multiply(z,z),cube=multiply(square,z);
    vec2 gradient=multiply(square,derivative);
    normal=normalize(multiply(cube-vec2(1.,0.),vec2(gradient.x,-gradient.y))+vec2(1.e-20,0.));
    vec2 slope=(vec2(1.,0.)-divide(vec2(1.,0.),cube))*(2./3.);
    derivative=normalize(multiply(derivative,slope)+vec2(1.e-20,0.));
    z=z*(2./3.)+divide(vec2(1.,0.),square)/3.;
    float radius=length(z);if(radius>10000.)z*=10000./radius;
    error=length(multiply(multiply(z,z),z)-vec2(1.,0.));steps+=1.;
    if(error<.0001)break;
  }
  float smoothSteps=max(0.,steps-log(log(clamp(error,1.e-12,.999))/log(.0001))/log(2.));
  float basin=floor(atan(z.y,z.x)/TAU*3.+.5);
  float light=.72+.28*dot(normal,normalize(vec2(-.6,1.)));
  vec3 col=palette(smoothSteps*.032+basin*.09+u_phase+.2);
  col*=mix(1.,.48+light*.65,u_relief);
  col+=u_p4*pow(light,22.)*u_relief*.1;
  return col;
}
vec3 julia(vec2 p,float footprint){
  vec2 z=p,derivative=vec2(1.,0.);float logDerivative=0.,trap=10.,iteration=0.;bool escaped=false;
  int degree=u_type<2||u_type==5?2:u_type+1;
  for(int i=0;i<360;i++){
    if(i>=u_iterations)break;
    float r=max(length(z),1.e-10),a=atan(z.y,z.x),d=float(degree);
    vec2 direction=degree==2?z/r:vec2(cos(a*(d-1.)),sin(a*(d-1.)));
    derivative=multiply(derivative,direction);logDerivative+=log(d)+(d-1.)*log(r);
    z=(degree==2?multiply(z,z):pow(r,d)*vec2(cos(a*d),sin(a*d)))+u_seed;
    iteration+=1.;trap=min(trap,abs(length(z)-.6));
    if(dot(z,z)>4096.){escaped=true;break;}
  }
  vec3 edge=mix(u_p2,u_p4,.25)*.65;
  if(!escaped)return mix(u_p0*.65,u_p3*.22,.2+.3*exp(-8.*trap));
  float radius=length(z),smoothN=iteration+1.-log(log(radius))/log(float(degree));
  vec2 normal=multiply(z/radius,vec2(derivative.x,-derivative.y));
  float light=.62+.38*dot(normal,normalize(vec2(-.6,1.)));
  float distance=.5*log(radius)*radius*exp(clamp(-logDerivative,-80.,20.));
  // Details smaller than a pixel become a smooth filament, never random speckles.
  float resolved=smoothstep(footprint*.015,footprint*.45,distance);
  float contour=1.-exp(-pow(max(distance,0.)*32.,.45));
  vec3 col=palette(smoothN*.032+u_phase+.16);
  col*=mix(1.,.34+light*.85,u_relief)*(.55+.45*contour);
  col+=u_p4*pow(max(light,0.),22.)*u_relief*.13*contour;
  vec2 orbit=vec2(atan(z.y,z.x)/PI,fract(log(log(radius))/log(float(degree)))*1.4-.7);
  float ink=(1.-smoothstep(.008,.025,emblem(orbit)))*u_emblem*resolved*smoothstep(14.,28.,smoothN);
  col=mix(col,u_p2,ink*.3);
  return mix(edge,col,resolved);
}
vec3 field2D(vec2 screen){
  vec2 q=loopCoordinates(screen);float pixel=2./u_resolution.y;
  if(u_type==4)return newton(q);
  float footprint=max(length(loopCoordinates(screen+vec2(pixel,0.))-q),length(loopCoordinates(screen+vec2(0.,pixel))-q));
  return julia(q,max(footprint,.00001));
}
void main(){
  vec3 col=vec3(0.);float count=0.;
  for(int sample=0;sample<4;sample++){
    if(sample>=u_samples)break;
    vec2 offset=vec2(0.);
    if(u_samples==2)offset=sample==0?vec2(-.25,.25):vec2(.25,-.25);
    if(u_samples==4)offset=vec2(mod(float(sample),2.)-.5,floor(float(sample)/2.)-.5)*.5;
    col+=field2D(screenPoint(offset));count+=1.;
  }
  gl_FragColor=vec4(finish(col/count),1.);
}
`;
const THREE_D=`
float box(vec3 p,vec3 size){vec3 q=abs(p)-size;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float bulb(vec3 p){
  vec3 z=p;float dr=1.,r=0.;
  for(int i=0;i<10;i++){
    r=length(z);if(r>2.8)break;
    float safe=max(r,.00001),theta=acos(clamp(z.z/safe,-1.,1.)),phi=atan(z.y,z.x);
    dr=8.*pow(safe,7.)*dr+1.;float radius=pow(safe,8.);theta*=8.;phi*=8.;
    z=radius*vec3(sin(theta)*cos(phi),sin(theta)*sin(phi),cos(theta))+p;
  }
  return .5*log(max(r,.00001))*r/dr;
}
float mandelbox(vec3 p){
  vec3 z=p;float dr=1.;
  for(int i=0;i<11;i++){
    z=2.*clamp(z,-1.,1.)-z;float r2=dot(z,z),fold=clamp(1./max(r2,.25),1.,4.);
    z=z*fold*(-1.75)+p;dr=dr*fold*1.75+1.;
  }
  return length(z)/dr;
}
float sponge(vec3 p){
  float d=box(p,vec3(1.)),scale=1.;
  for(int i=0;i<5;i++){
    vec3 a=mod((p+1.)*scale,2.)-1.,t=u_type==8?abs(a)-1./3.:1./3.-abs(a);
    d=max(d,max(min(t.x,t.y),max(min(t.x,t.z),min(t.y,t.z)))/scale);scale*=3.;
  }
  return d;
}
float sculpture(vec3 p){
  p.xz=rotate(p.xz,u_type==6?.23:-.18);p.xy=rotate(p.xy,u_type==7?.38:.12);
  if(u_type==6)return bulb(p/.95)*.95;
  if(u_type==7)return mandelbox(p/.38)*.38;
  return (sponge(p/.8)-(u_type==8?.045:.008))*.8;
}
// Real 3D geometry at every scale. Neighbouring shells coexist in the world;
// scaling the camera by R reveals the smaller copy already inside the corridor.
float distanceField(vec3 p){
  float radius=max(length(p),1.e-9),scale=exp(floor(log(radius)/u_loop.x)*u_loop.x),ratio=exp(u_loop.x),d=radius*100.;
  for(int layer=0;layer<3;layer++){
    float size=scale/ratio;if(layer==1)size=scale;if(layer==2)size=scale*ratio;
    vec3 q=p/size;
    float sides=u_type==6?5.:u_type==7?4.:6.;
    float angle=atan(q.y,q.x),sector=TAU/sides;
    q.xy=rotate(q.xy,-floor(angle/sector+.5)*sector);q-=vec3(1.48,0.,1.3);
    float bound=length(q)-1.5;
    float local=bound>.14?bound:sculpture(q);
    d=min(d,local*size);
  }
  return d;
}
vec3 surfaceNormal(vec3 p,float e){
  vec2 k=vec2(1.,-1.);
  return normalize(k.xyy*distanceField(p+k.xyy*e)+k.yyx*distanceField(p+k.yyx*e)+k.yxy*distanceField(p+k.yxy*e)+k.xxx*distanceField(p+k.xxx*e));
}
float ambientOcclusion(vec3 p,vec3 n,float size){
  float occlusion=0.,weight=1.;
  for(int i=1;i<=4;i++){float h=size*.025*float(i);occlusion+=(h-distanceField(p+n*h))*weight/h;weight*=.55;}
  return clamp(1.-occlusion*.35,.45,1.);
}
float shadow(vec3 p,vec3 light,float size){
  float result=1.,t=size*.008;
  for(int i=0;i<20;i++){
    float d=distanceField(p+light*t);result=min(result,12.*d/t);t+=clamp(d,size*.006,size*.15);
    if(result<.05||t>size*1.6)break;
  }
  return clamp(result,.3,1.);
}
vec3 field3D(vec2 screen){
  float cameraScale=exp(-u_zoomPhase*u_loop.x);
  vec3 ro=vec3(.06,.1,4.8)*cameraScale;
  vec3 forward=normalize(-ro),right=normalize(cross(forward,vec3(0.,1.,0.))),up=cross(right,forward);
  vec3 rd=normalize(forward*1.8+right*screen.x+up*screen.y);
  float t=0.,epsilon=cameraScale*.00035;bool hit=false;
  for(int i=0;i<160;i++){
    vec3 point=ro+rd*t;float d=distanceField(point);
    epsilon=max(cameraScale*.00012,t/u_resolution.y*.3)*mix(1.3,.7,(float(u_iterations)-80.)/280.);
    if(d<epsilon){hit=true;break;}
    t+=max(d*.72,epsilon*.3);if(t>cameraScale*10.)break;
  }
  vec3 background=mix(u_p0*.65,u_p3*.16,clamp(.5+.3*screen.y,0.,1.));
  if(!hit)return background;
  vec3 p=ro+rd*t,n=surfaceNormal(p,epsilon*.7),light=normalize(vec3(-.6,.8,1.2));
  float size=max(length(p),cameraScale*.002),ao=ambientOcclusion(p,n,size),shade=shadow(p+n*epsilon*3.,light,size);
  float diffuse=max(dot(n,light),0.)*shade,hemisphere=.5+.5*n.y;
  float specular=pow(max(dot(n,normalize(light-rd)),0.),48.)*shade;
  float rim=pow(1.-max(dot(n,-rd),0.),3.);
  float cycle=log(max(length(p),1.e-8))/u_loop.x;
  float tone=.64+.2*sin(cycle*TAU+u_phase*TAU);
  vec3 material=mix(u_p1,u_p2,tone);
  float fill=max(dot(n,-rd),0.);
  vec3 col=material*(.28+.2*hemisphere+.85*diffuse+.28*fill)*ao+u_p4*(specular*.55+rim*.16)*ao;
  col=mix(material*.72,col,.45+.55*u_relief);
  vec2 oval=vec2(atan(p.y,p.x)/PI, sin(cycle*TAU)*.7);
  float ink=(1.-smoothstep(.009,.028,emblem(oval)))*u_emblem;
  col=mix(col,col*1.12+u_p4*.035,ink*.3);
  return mix(col,background,1.-exp(-t/cameraScale*.035));
}
void main(){
  vec3 col=vec3(0.);float count=0.;
  for(int sample=0;sample<4;sample++){
    if(sample>=u_samples)break;
    vec2 offset=vec2(0.);
    if(u_samples==2)offset=sample==0?vec2(-.25,.25):vec2(.25,-.25);
    if(u_samples==4)offset=vec2(mod(float(sample),2.)-.5,floor(float(sample)/2.)-.5)*.5;
    col+=field3D(screenPoint(offset));count+=1.;
  }
  gl_FragColor=vec4(finish(col/count),1.);
}
`;
export const fragmentFor=type=>COMMON+(type>=6?THREE_D:TWO_D);
export const FRAGMENT=fragmentFor(0);
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export function renderUniforms(settings,camera,width,height){
  const {phase,rotation,model:m}=camera.frame();
  const u={u_resolution:[width,height],u_seed:settings.c,u_loop:[Math.log(m.ratio),m.spokes,m.twist,m.warp],u_zoomPhase:phase,u_rotation:rotation,u_emblem:settings.emblem/100,u_relief:settings.relief/100,u_phase:settings.phase||0,u_iterations:settings.detail,u_type:settings.type,u_samples:settings.samples||2};
  PALETTES[settings.palette].colors.forEach((color,i)=>u['u_p'+i]=rgb(color));return u;
}
export class FractalRenderer{
  constructor(canvas){
    this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
    if(!this.gl)throw new Error('WebGL недоступен');this.programs=new Map();
    const gl=this.gl,buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  }
  prepare(type){
    const key=type>=6?3:2;
    if(this.programs.has(key)){const entry=this.programs.get(key);this.program=entry.program;this.uniforms=entry.uniforms;return;}
    const gl=this.gl,shader=(kind,src)=>{const s=gl.createShader(kind);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const vs=shader(gl.VERTEX_SHADER,VERTEX),fs=shader(gl.FRAGMENT_SHADER,fragmentFor(type));this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.bindAttribLocation(this.program,0,'a_position');gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));gl.deleteShader(vs);gl.deleteShader(fs);
    this.uniforms={};for(const name of ['resolution','seed','loop','zoomPhase','rotation','emblem','relief','phase','iterations','type','samples','p0','p1','p2','p3','p4'])this.uniforms['u_'+name]=gl.getUniformLocation(this.program,'u_'+name);
    this.programs.set(key,{program:this.program,uniforms:this.uniforms});
  }
  render(settings,camera){
    this.prepare(settings.type);
    if(!camera.frame)camera=new InfiniteCamera([0,0],1,camera.angle,dynamics(settings.type,settings.c));
    const gl=this.gl;gl.useProgram(this.program);gl.viewport(0,0,this.canvas.width,this.canvas.height);
    for(const[name,value]of Object.entries(renderUniforms(settings,camera,this.canvas.width,this.canvas.height))){const u=this.uniforms[name];if(Array.isArray(value)){if(value.length===2)gl.uniform2fv(u,value);else if(value.length===3)gl.uniform3fv(u,value);else gl.uniform4fv(u,value);}else if(name==='u_type'||name==='u_iterations'||name==='u_samples')gl.uniform1i(u,value);else gl.uniform1f(u,value);}
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
}
