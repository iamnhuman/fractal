"""Render deterministic artwork from the site's scene formulas; no browser required."""
import json, math, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
np.seterr(all='ignore')
ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads(Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/fractal-render-config.json').read_text())
W,H=640,360
Y,X=np.mgrid[0:H,0:W];UV=np.stack(((X+.5)/W,1-(Y+.5)/H),axis=-1)
P=(UV*2-1)*np.array([W/H,1])
def smooth(a,b,x):
 t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def palette(t,u):
 v=np.mod(t,1)*5;i=np.floor(v).astype(int);f=smooth(0,1,v-i)[...,None]
 colors=np.array([u['u_p'+str(j)] for j in range(5)])
 return colors[i%5]*(1-f)+colors[(i+1)%5]*f
def mark(z):
 x,y=z.real,z.imag
 return np.minimum(np.minimum(abs(np.hypot(x/.85,y/.56)-1)*.56,abs(np.hypot(x/.26,y/.56)-1)*.26),abs(np.hypot(x/.64,(y-.21)/.24)-1)*.24)
def domain(p,seed):return (np.sin(p*math.pi*.5)+.12*np.sin(p[...,::-1]*math.pi+np.array([seed,seed*.7])))*1.32
def field2(p,seed,u,pixel):
 q=domain(p,seed);z=q[...,0]+1j*q[...,1];c=complex(*u['u_c']);typ=u['u_type'];dz=np.ones(z.shape,dtype=complex);old=np.zeros_like(z)
 if typ in (1,2,3):c=z.copy();z=np.zeros_like(z);dz*=0
 if typ==1:c-=.45
 if typ==2:c+=complex(-.4,-.35)
 n=np.zeros(z.shape);trap=np.full(z.shape,10.);ti=np.zeros(z.shape);stripe=np.zeros(z.shape);active=np.ones(z.shape,dtype=bool);escaped=np.zeros(z.shape,dtype=bool)
 for i in range(u['u_iterations']):
  if not active.any():break
  a=active;zz=z[a]
  if typ==7:
   step=np.divide(zz**3-1,3*zz**2,out=np.zeros_like(zz),where=abs(zz)>1e-8);z[a]-=step;n[a]=i;trap[a]=np.minimum(trap[a],mark(z[a]));done=abs(step)**2<1e-7;escaped[a]=done;active[a]=~done;continue
  dz[a]=2*zz*dz[a]+(1 if typ in (1,2,3) else 0);cc=c[a] if isinstance(c,np.ndarray) else c
  if typ==2:zz=abs(zz.real)+1j*abs(zz.imag)
  if typ==3:zz=zz.conjugate()
  nxt=zz**3+cc if typ==6 else zz**2
  if typ==5:nxt+=c.real+c.imag*old[a]
  elif typ!=6:
   if typ==4:nxt=abs(nxt.real)+1j*nxt.imag
   nxt+=cc
  old[a]=z[a];z[a]=nxt;n[a]=i;r2=abs(z)**2
  if i<32:
   eligible=a&(r2<9);d=mark(z);better=eligible&(d<trap);trap[better]=d[better];ti[better]=i;stripe[eligible]+=np.exp(-abs(abs(z[eligible])-.8)*5)
  done=a&(r2>256);escaped[done]=True;active[done]=False
 r2=abs(z)**2;sn=n+1-np.log2(np.maximum(np.log2(np.maximum(r2,1.001))*.5,.001));normal=z/(dz+1e-50);normal/=np.maximum(abs(normal),1e-20);light=.65+.35*(normal.real*(-.6)+normal.imag)/math.hypot(.6,1)
 bands=sn*.026+u['u_phase']+seed*.025
 if typ==7:bands=np.angle(z)/(2*math.pi)+n*.032+u['u_phase']
 orbit=np.exp(-trap*32)*u['u_emblem'];col=palette(bands+orbit*.1,u);col*=((1-u['u_relief'])+u['u_relief']*(.28+light*.85))[...,None];col+=np.array(u['u_p4'])*(np.maximum(light,0)**18*u['u_relief']*.16)[...,None]
 amount=.32+np.exp(-trap*20)*.5;inside=np.array(u['u_p0'])*.8*(1-amount[...,None])+palette(stripe*.045+ti*.017+u['u_phase'],u)*amount[...,None];col[~escaped]=inside[~escaped]
 width=max(.004,min(.035,pixel*1.8));ink=(1-smooth(width,width*2.5,np.minimum(trap,mark((q[...,0]+1j*q[...,1])*1.15))))*u['u_emblem']*.82
 return np.nan_to_num(col*(1-ink[...,None])+(np.array(u['u_p2'])*.65+np.array(u['u_p4'])*.35)*ink[...,None])
a,b=.57,.38
TURN=np.array([[math.cos(a),0,-math.sin(a)],[0,1,0],[math.sin(a),0,math.cos(a)]])@np.array([[1,0,0],[0,math.cos(b),math.sin(b)],[0,-math.sin(b),math.cos(b)]])
def dist(p,typ):
 p=p@TURN.T
 if typ==9:
  q=abs(p)-1;d=np.linalg.norm(np.maximum(q,0),axis=-1)+np.minimum(np.max(q,axis=-1),0);s=1.
  for _ in range(5):
   a=(p*s+1)%2-1;s*=3;r=abs(1-3*abs(a));holes=(np.minimum(np.maximum(r[...,0],r[...,1]),np.minimum(np.maximum(r[...,1],r[...,2]),np.maximum(r[...,2],r[...,0])))-1)/s;d=np.maximum(d,holes)
  return d
 z=p.copy();dr=np.ones(p.shape[:-1]);r=np.zeros_like(dr);active=np.ones_like(r,dtype=bool)
 for _ in range(8):
  r[active]=np.linalg.norm(z[active],axis=-1);active&=r<=2.5
  if not active.any():break
  rr=np.maximum(r[active],1e-5);zz=z[active];theta=np.arccos(np.clip(zz[...,2]/rr,-1,1))*8;phi=np.arctan2(zz[...,1],zz[...,0])*8;dr[active]=rr**7*8*dr[active]+1;zr=rr**8;z[active]=zr[...,None]*np.stack([np.sin(theta)*np.cos(phi),np.sin(theta)*np.sin(phi),np.cos(theta)],axis=-1)+p[active]
 return .5*np.log(np.maximum(r,1e-5))*r/np.maximum(dr,1e-5)
def field3(p,seed,u):
 screen=domain(p,seed)*.7;rd=np.concatenate([screen,np.full(screen.shape[:-1]+(1,),-3.2)],axis=-1);rd/=np.linalg.norm(rd,axis=-1)[...,None];ro=np.array([0,0,4.4]);t=np.full((H,W),1.7);glow=np.zeros_like(t);active=np.ones_like(t,dtype=bool);hit=np.zeros_like(active)
 for _ in range(88):
  if not active.any():break
  d=dist(ro+rd[active]*t[active,None],u['u_type']);glow[active]+=np.exp(-abs(d)*35)*.008;done=d<.0012;hit[active]=done;indices=np.where(active);t[indices]+=np.where(done,0,np.maximum(d*.75,.0006));active&=~hit;active&=t<=7
 col=np.array(u['u_p0'])*.6*(1-np.clip(glow,0,1)[...,None])+np.array(u['u_p3'])*.3*np.clip(glow,0,1)[...,None]
 if hit.any():
  p=ro+rd[hit]*t[hit,None];e=.0015;n=np.stack([dist(p+np.eye(3)[i]*e,u['u_type'])-dist(p-np.eye(3)[i]*e,u['u_type']) for i in range(3)],axis=-1);n/=np.maximum(np.linalg.norm(n,axis=-1)[...,None],1e-20);light=np.array([-.6,.8,1]);light/=np.linalg.norm(light);diff=np.maximum(n@light,0);ao=np.clip(dist(p+n*.075,u['u_type'])/.075,.48,1);ref=-light+2*(n@light)[...,None]*n;spec=np.maximum(np.sum(ref*(-rd[hit]),axis=-1),0)**28;f=.7+.3*np.sin(p[...,1]*3+p[...,0]*2);material=np.array(u['u_p1'])*(1-f[...,None])+np.array(u['u_p2'])*f[...,None];c=material*((.35+.65*diff)*ao)[...,None]+np.array(u['u_p4'])*spec[...,None]*.5;local=p@TURN.T;lines=(1-smooth(.009,.025,mark((local[...,0]+1j*local[...,1])*.85)))*u['u_emblem']*.8;c=c*(1-lines[...,None])+np.array(u['u_p4'])*(.3+.7*diff)[...,None]*lines[...,None];fog=1-np.exp(-t[hit]**2*.009);col[hit]=c*(1-fog[...,None])+np.array(u['u_p0'])*fog[...,None]
 return col
images=[]
for scene in CONFIG['scenes']:
 u=scene['uniforms'];co,si=math.cos(u['u_rotation']),math.sin(u['u_rotation']);p=P@np.array([[co,-si],[si,co]])
 def layer(i):
  origin=np.array(u['u_origin'+str(i)]);scale=u['u_scale'+str(i)];point=origin+p*scale;seed=u['u_seed'+str(i)];return field3(point,seed,u) if u['u_type']>=8 else field2(point,seed,u,scale/H)
 mix=u['u_blend'];col=layer(0) if mix<.0001 else layer(1) if mix>.9999 else layer(0)*(1-mix)+layer(1)*mix
 col*= (1-.12*(np.linalg.norm(UV-.5,axis=-1)*1.3)**2)[...,None];col=np.clip(np.nan_to_num(np.maximum(col,0)**.94),0,1)
 im=Image.fromarray((col*255).astype('uint8'));images.append(im);im.resize((384,216),Image.Resampling.LANCZOS).save(ROOT/'dist/previews'/f"{scene['file']}.jpg",quality=88);print('Rendered',scene['file'],flush=True)
# A single share-card uses the actual procedural scenes, with a quiet title strip.
card=Image.new('RGB',(1200,630),'#101113');draw=ImageDraw.Draw(card)
font_path='/System/Library/Fonts/Supplemental/Arial.ttf'
font=ImageFont.truetype(font_path,46);small=ImageFont.truetype(font_path,18)
draw.text((40,29),'FRACTAL / LAB',font=font,fill='#f4eeea');draw.text((42,91),'10 WORLDS  /  INFINITE EXPLORATION  /  2D + 3D',font=small,fill='#aaa3ae')
for idx,(scene_index,box) in enumerate([(0,(0,140,600,630)),(8,(600,140,900,630)),(9,(900,140,1200,630))]):
 art=ImageOps.fit(images[scene_index],(box[2]-box[0],box[3]-box[1]),method=Image.Resampling.LANCZOS);card.paste(art,box[:2])
card.save(ROOT/'dist/preview.jpg',quality=93,optimize=True)
# Contact sheet is an asset inspection aid, never a screenshot of the website.
sheet=Image.new('RGB',(1280,900),'#101113');draw=ImageDraw.Draw(sheet)
for i,im in enumerate(images):
 x=i%2*640;y=i//2*180;sheet.paste(im.resize((640,180)),(x,y));draw.text((x+12,y+12),f"{i+1:02d}",font=small,fill='white',stroke_width=2,stroke_fill='black')
sheet.save('/tmp/fractal-scenes.jpg',quality=90)
print('Social preview saved: 1200x630',flush=True)
