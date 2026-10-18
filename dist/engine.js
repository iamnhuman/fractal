import {InfiniteCamera} from './navigation.js';
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
export const GEOMETRIES=['Julia','Mandelbrot','Burning Ship','Tricorn','Celtic','Phoenix','Multibrot','Newton','Mandelbulb · 3D','Menger · 3D'];
export const SCENES = [
  {name:'Crimson Lace',description:'Кружево спиралей',palette:0,c:[-.74543,.11301],center:[-.14,.04],scale:.52,type:0,emblem:55,angle:-.15},
  {name:'Ocean Valley',description:'Острова и электрические русла',palette:1,c:[0,0],center:[-.42,.05],scale:.95,type:1,emblem:30,angle:0},
  {name:'Solar Flare',description:'Огненные иглы и башни',palette:2,c:[0,0],center:[-.6,-.6],scale:1.05,type:2,emblem:35,angle:.12},
  {name:'Violet Mirror',description:'Тройная зеркальная симметрия',palette:3,c:[0,0],center:[0,0],scale:1.15,type:3,emblem:45,angle:.35},
  {name:'Jade Knot',description:'Переплетения зелёных лент',palette:4,c:[-.42,.61],center:[.02,.02],scale:.65,type:4,emblem:65,angle:-.35},
  {name:'Copper Feather',description:'Ветвящиеся медные перья',palette:5,c:[.56667,-.5],center:[0,0],scale:.95,type:5,emblem:40,angle:.2},
  {name:'Electric Bloom',description:'Трёхлепестковые созвездия',palette:6,c:[-.12,.72],center:[0,0],scale:.85,type:6,emblem:50,angle:-.2},
  {name:'Prism Roots',description:'Мозаика бассейнов Ньютона',palette:7,c:[0,0],center:[0,0],scale:1.1,type:7,emblem:35,angle:.1},
  {name:'Pearl Planet',description:'Объёмный Mandelbulb',palette:8,c:[0,0],center:[0,0],scale:.95,type:8,emblem:30,angle:0},
  {name:'Golden Labyrinth',description:'Объёмная губка Менгера',palette:9,c:[0,0],center:[0,0],scale:.95,type:9,emblem:35,angle:0}
];
export const VERTEX=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
export const FRAGMENT=`precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution,u_origin0,u_origin1,u_c;
uniform float u_scale0,u_scale1,u_blend,u_seed0,u_seed1,u_rotation,u_emblem,u_relief,u_phase;
uniform int u_iterations,u_type;
uniform vec3 u_p0,u_p1,u_p2,u_p3,u_p4;
const float PI=3.141592653589793;
vec2 mul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 divc(vec2 a,vec2 b){return vec2(dot(a,b),a.y*b.x-a.x*b.y)/max(dot(b,b),1.e-16);}
float ellipse(vec2 p,vec2 r){return abs(length(p/r)-1.)*min(r.x,r.y);}
float emblem(vec2 p){return min(ellipse(p,vec2(.85,.56)),min(ellipse(p,vec2(.26,.56)),ellipse(p-vec2(0.,.21),vec2(.64,.24))));}
vec3 palette(float t){t=fract(t)*5.;if(t<1.)return mix(u_p0,u_p1,smoothstep(0.,1.,t));if(t<2.)return mix(u_p1,u_p2,smoothstep(0.,1.,t-1.));if(t<3.)return mix(u_p2,u_p3,smoothstep(0.,1.,t-2.));if(t<4.)return mix(u_p3,u_p4,smoothstep(0.,1.,t-3.));return mix(u_p4,u_p0,smoothstep(0.,1.,t-4.));}
vec2 domain(vec2 p,float seed){vec2 q=sin(p*(PI*.5));q+=.12*sin(p.yx*PI+vec2(seed,seed*.7));return q*1.32;}
vec3 field2D(vec2 position,float seed,float pixel){
vec2 p=domain(position,seed),z=p,c=u_c,previous=vec2(0.),dz=vec2(1.,0.);
if(u_type==1||u_type==2||u_type==3){c=p;z=vec2(0.);dz=vec2(0.);}
if(u_type==1)c.x-=.45;if(u_type==2)c+=vec2(-.4,-.35);
float n=0.,trap=10.,trapIter=0.,stripe=0.,r2=0.,escaped=0.;
for(int i=0;i<360;i++){
if(i>=u_iterations)break;
if(u_type==7){vec2 z2=mul(z,z),z3=mul(z2,z);vec2 step=divc(z3-vec2(1.,0.),3.*z2);z-=step;n=float(i);r2=dot(z,z);trap=min(trap,emblem(z));if(dot(step,step)<.0000001){escaped=1.;break;}continue;}
dz=2.*mul(z,dz);if(u_type==1||u_type==2||u_type==3)dz+=vec2(1.,0.);
vec2 old=z;if(u_type==2)z=abs(z);if(u_type==3)z.y=-z.y;
if(u_type==6)z=mul(mul(z,z),z)+c;
else if(u_type==5)z=mul(z,z)+vec2(c.x,0.)+c.y*previous;
else{z=mul(z,z);if(u_type==4)z.x=abs(z.x);z+=c;}
previous=old;r2=dot(z,z);n=float(i);
if(i<32&&r2<9.){float d=emblem(z);if(d<trap){trap=d;trapIter=float(i);}stripe+=exp(-abs(length(z)-.8)*5.);}
if(r2>256.){escaped=1.;break;}
}
float smoothN=n+1.-log2(max(log2(max(r2,1.001))*.5,.001));
vec2 normal=normalize(divc(z,dz)+vec2(.000001));
float light=.65+.35*dot(normal,normalize(vec2(-.6,1.)));
float bands=smoothN*.026+u_phase+seed*.025;
if(u_type==7)bands=atan(z.y,z.x)/(2.*PI)+n*.032+u_phase;
float orbit=exp(-trap*32.)*u_emblem;vec3 col=palette(bands+orbit*.1);
col*=mix(1.,.28+light*.85,u_relief);col+=u_p4*pow(max(light,0.),18.)*u_relief*.16;
if(escaped<.5)col=mix(u_p0*.8,palette(stripe*.045+trapIter*.017+u_phase),.32+exp(-trap*20.)*.5);
float localMark=emblem(p*1.15),width=max(.004,min(.035,pixel*1.8));
float ink=(1.-smoothstep(width,width*2.5,min(trap,localMark)))*u_emblem;
col=mix(col,mix(u_p2,u_p4,.35),ink*.82);return col;
}
mat3 turn(){float a=.57,b=.38;return mat3(cos(a),0.,sin(a),0.,1.,0.,-sin(a),0.,cos(a))*mat3(1.,0.,0.,0.,cos(b),-sin(b),0.,sin(b),cos(b));}
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float distanceField(vec3 p){
p=turn()*p;
if(u_type==9){float d=box(p,vec3(1.)),s=1.;for(int i=0;i<5;i++){vec3 a=mod(p*s+1.,2.)-1.;s*=3.;vec3 r=abs(1.-3.*abs(a));float holes=(min(max(r.x,r.y),min(max(r.y,r.z),max(r.z,r.x)))-1.)/s;d=max(d,holes);}return d;}
vec3 z=p;float dr=1.,r=0.;for(int i=0;i<8;i++){r=length(z);if(r>2.5)break;float safeR=max(r,.00001),theta=acos(clamp(z.z/safeR,-1.,1.)),phi=atan(z.y,z.x);dr=pow(safeR,7.)*8.*dr+1.;float zr=pow(safeR,8.);theta*=8.;phi*=8.;z=zr*vec3(sin(theta)*cos(phi),sin(theta)*sin(phi),cos(theta))+p;}return .5*log(max(r,.00001))*r/max(dr,.00001);
}
vec3 field3D(vec2 position,float seed){
vec2 screen=domain(position,seed)*.7;vec3 ro=vec3(0.,0.,4.4),rd=normalize(vec3(screen,-3.2));float t=1.7,glow=0.;bool hit=false;
for(int i=0;i<88;i++){float d=distanceField(ro+rd*t);glow+=exp(-abs(d)*35.)*.008;if(d<.0012){hit=true;break;}t+=max(d*.75,.0006);if(t>7.)break;}
vec3 col=mix(u_p0*.6,u_p3*.3,clamp(glow,0.,1.));
if(hit){vec3 p=ro+rd*t;vec2 e=vec2(.0015,0.);vec3 normal=normalize(vec3(distanceField(p+e.xyy)-distanceField(p-e.xyy),distanceField(p+e.yxy)-distanceField(p-e.yxy),distanceField(p+e.yyx)-distanceField(p-e.yyx)));vec3 light=normalize(vec3(-.6,.8,1.));float diffuse=max(dot(normal,light),0.);float ao=clamp(distanceField(p+normal*.075)/.075,.48,1.);float spec=pow(max(dot(reflect(-light,normal),-rd),0.),28.);vec3 material=mix(u_p1,u_p2,.7+.3*sin(p.y*3.+p.x*2.+u_phase*6.));col=material*(.35+.65*diffuse)*ao+u_p4*spec*.5;float lines=1.-smoothstep(.009,.025,emblem((turn()*p).xy*.85));col=mix(col,u_p4*(.3+.7*diffuse),lines*u_emblem*.8);col=mix(col,u_p0,1.-exp(-t*t*.009));}
return col;
}
vec3 field(vec2 p,float seed,float pixel){if(u_type>=8)return field3D(p,seed);return field2D(p,seed,pixel);}
void main(){vec2 p=(v_uv*2.-1.)*vec2(u_resolution.x/u_resolution.y,1.);float co=cos(u_rotation),si=sin(u_rotation);p=mat2(co,-si,si,co)*p;vec3 col;
if(u_blend<.0001)col=field(u_origin0+p*u_scale0,u_seed0,u_scale0/u_resolution.y);
else if(u_blend>.9999)col=field(u_origin1+p*u_scale1,u_seed1,u_scale1/u_resolution.y);
else col=mix(field(u_origin0+p*u_scale0,u_seed0,u_scale0/u_resolution.y),field(u_origin1+p*u_scale1,u_seed1,u_scale1/u_resolution.y),u_blend);
col*=1.-.12*pow(length(v_uv-.5)*1.3,2.);gl_FragColor=vec4(pow(max(col,vec3(0.)),vec3(.94)),1.);}
`;
export function fragmentFor(type){
  if(type>=8){const start=FRAGMENT.indexOf('vec3 field2D('),end=FRAGMENT.indexOf('mat3 turn()');return (FRAGMENT.slice(0,start)+FRAGMENT.slice(end)).replace('if(u_type>=8)return field3D(p,seed);return field2D(p,seed,pixel);','return field3D(p,seed);');}
  const start=FRAGMENT.indexOf('mat3 turn()'),end=FRAGMENT.indexOf('vec3 field(vec2');return (FRAGMENT.slice(0,start)+FRAGMENT.slice(end)).replace('if(u_type>=8)return field3D(p,seed);return field2D(p,seed,pixel);','return field2D(p,seed,pixel);');
}
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export class FractalRenderer{
constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});if(!this.gl)throw new Error('WebGL недоступен');this.programs=new Map();const gl=this.gl;
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);}
prepare(type){const key=type>=8?3:2;if(this.programs.has(key)){const entry=this.programs.get(key);this.program=entry.program;this.uniforms=entry.uniforms;return;}const gl=this.gl;
const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};const vs=shader(gl.VERTEX_SHADER,VERTEX),fs=shader(gl.FRAGMENT_SHADER,fragmentFor(type));this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.bindAttribLocation(this.program,0,'a_position');gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(this.program);
this.uniforms={};['resolution','origin0','origin1','c','scale0','scale1','blend','seed0','seed1','rotation','emblem','relief','phase','iterations','type','p0','p1','p2','p3','p4'].forEach(n=>this.uniforms[n]=gl.getUniformLocation(this.program,'u_'+n));this.programs.set(key,{program:this.program,uniforms:this.uniforms});}
render(settings,camera){this.prepare(settings.type);if(!camera.layers)camera=new InfiniteCamera(camera.center,camera.scale,camera.angle);const gl=this.gl,u=this.uniforms,{coarse,fine,blend}=camera.layers();gl.useProgram(this.program);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.uniform2f(u.resolution,this.canvas.width,this.canvas.height);gl.uniform2fv(u.c,settings.c);
for(const[i,layer]of[coarse,fine].entries()){gl.uniform2fv(u['origin'+i],layer.origin);gl.uniform1f(u['scale'+i],layer.scale);gl.uniform1f(u['seed'+i],((layer.level%97+97)%97)*.173);}
gl.uniform1f(u.blend,blend);gl.uniform1f(u.rotation,camera.angle);gl.uniform1f(u.emblem,settings.emblem/100);gl.uniform1f(u.relief,settings.relief/100);gl.uniform1f(u.phase,settings.phase||0);gl.uniform1i(u.iterations,settings.detail);gl.uniform1i(u.type,settings.type);PALETTES[settings.palette].colors.forEach((hex,i)=>gl.uniform3fv(u['p'+i],rgb(hex)));gl.drawArrays(gl.TRIANGLES,0,6);}
}
