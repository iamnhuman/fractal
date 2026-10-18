"""Reproducible artwork using the same seamless coordinate map and fields as WebGL."""
import json,math,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageOps
np.seterr(all='ignore')
ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads(Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/fractal-render-config.json').read_text())
W,H=640,360
Y,X=np.mgrid[0:H,0:W];P=np.stack((((X+.5)/W*2-1)*W/H,1-(Y+.5)/H*2),axis=-1)
def smooth(a,b,x):
 t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def palette(t,u):
 v=np.mod(t,1)*5;i=np.floor(v).astype(int);f=smooth(0,1,v-i)[...,None];colors=np.array([u['u_p'+str(j)] for j in range(5)])
 return colors[i%5]*(1-f)+colors[(i+1)%5]*f
def mark(p):
 x,y=p[...,0],p[...,1];return np.minimum(np.minimum(abs(np.hypot(x/.85,y/.56)-1)*.56,abs(np.hypot(x/.26,y/.56)-1)*.26),abs(np.hypot(x/.64,(y-.21)/.24)-1)*.24)
def coordinates(p,u):
 loop=u['u_loop'];r=np.maximum(np.linalg.norm(p,axis=-1),1e-12);a=np.arctan2(p[...,1],p[...,0]);phase=2*math.pi*np.mod(np.log(r)/loop[0]-u['u_zoomPhase'],1);v=loop[1]*a+loop[2]*phase;phase+=loop[3]*np.sin(v)
 return np.stack([.95*np.cos(phase)+.6*np.cos(v)+.13*np.sin(2*v-phase),.95*np.sin(phase)+.6*np.sin(v)+.13*np.cos(2*phase+v)],axis=-1)
def measure(p,u):
 shape=u['u_shape'];z=p*.72+np.array(u['u_seed']);derivative=np.ones(p.shape[:-1]);trap=np.full(p.shape[:-1],10.);rings=np.zeros_like(trap);weight=1.;c,s=math.cos(shape[1]),math.sin(shape[1])
 for i in range(u['u_iterations']):
  if u['u_type'] in (2,5):z=abs(z)-np.array([0,.42])
  if u['u_type'] in (3,7):z=abs(z);z=np.stack([np.maximum(z[...,0],z[...,1]),np.minimum(z[...,0],z[...,1])],axis=-1)-np.array([.3,.12])
  z=2*np.clip(z,-shape[2],shape[2])-z;r2=np.sum(z*z,axis=-1);fold=np.clip(1/np.maximum(r2,.04),1,5);z*=fold[...,None];derivative*=fold
  z=z@np.array([[c,s],[-s,c]])*shape[0]+p*.55+np.array(u['u_seed']);derivative=derivative*abs(shape[0])+1;trap=np.minimum(trap,abs(z[...,0])+.3*abs(z[...,1]));rings+=np.exp(-3*abs(r2-.7))*weight;weight*=.7
 distance=np.linalg.norm(z,axis=-1)/np.maximum(derivative,.001);tone=-np.log(np.maximum(distance,1e-16))*.052+trap*.17+rings*.045
 return tone,trap

def shade(p,u):
 tone,trap=measure(p,u);dx=measure(p+np.array([.002,0]),u)[0]-tone;dy=measure(p+np.array([0,.002]),u)[0]-tone;n=np.stack([-dx,-dy,np.full_like(dx,.03)],axis=-1);n/=np.linalg.norm(n,axis=-1)[...,None];light=np.array([-.5,.7,1]);light/=np.linalg.norm(light);level=.65+.35*(n@light)
 col=palette(tone+u['u_phase'],u)*.88+np.array(u['u_p2'])*.12;col*=((1-u['u_relief'])+u['u_relief']*(.45+level*.75))[...,None];col+=np.array(u['u_p4'])*np.exp(-14*trap)[...,None]*.1;ink=(1-smooth(.008,.023,mark(p*1.1)))*u['u_emblem']*.36
 return col*(1-ink[...,None])+np.array(u['u_p4'])*(.6+.4*level)[...,None]*ink[...,None]
def dist(p,typ):
 q=abs(p)-1;d=np.linalg.norm(np.maximum(q,0),axis=-1)+np.minimum(np.maximum(np.maximum(q[...,0],q[...,1]),q[...,2]),0);scale=1.
 for _ in range(7):
  a=((p+1)*scale)%2-1;t=abs(a)-1/3 if typ==8 else 1/3-abs(a);hole=np.maximum(np.minimum(t[...,0],t[...,1]),np.maximum(np.minimum(t[...,0],t[...,2]),np.minimum(t[...,1],t[...,2])))/scale;d=np.maximum(d,hole);scale*=3
 return d
def volume(screen,u):
 typ=u['u_type'];base=np.array([-3.2,2.6,3.8] if typ==9 else [3.2,2.6,3.8]);forward=-base/np.linalg.norm(base);right=np.cross(forward,[0,1,0]);right/=np.linalg.norm(right);up=np.cross(right,forward);ro=base*.7;rd=forward*2.8+screen[...,0,None]*right*.85+screen[...,1,None]*up*.85;rd/=np.linalg.norm(rd,axis=-1)[...,None]
 epsilon=.0009;t=np.zeros((H,W));active=np.ones_like(t,dtype=bool);hit=np.zeros_like(active)
 for _ in range(112):
  if not active.any():break
  d=dist(ro+rd[active]*t[active,None],typ);done=d<epsilon;hit[active]=done;indices=np.where(active);t[indices]+=np.where(done,0,np.maximum(d*.8,epsilon*.2));active&=~hit;active&=t<=35
 background=shade(screen,u);col=background*.85
 if hit.any():
  p=ro+rd[hit]*t[hit,None];e=epsilon*2;n=np.stack([dist(p+np.eye(3)[i]*e,typ)-dist(p-np.eye(3)[i]*e,typ) for i in range(3)],axis=-1);n/=np.maximum(np.linalg.norm(n,axis=-1)[...,None],1e-20);light=np.array([-.5,.9,1]);light/=np.linalg.norm(light);diff=np.maximum(n@light,0);ao=np.clip(dist(p+n*.045,typ)/.045,.4,1);ref=-light+2*(n@light)[...,None]*n;spec=np.maximum(np.sum(ref*(-rd[hit]),axis=-1),0)**24
  factor=.65+.25*np.sin(np.log(np.maximum(np.linalg.norm(p,axis=-1),.001))*2.4+u['u_phase']*2*math.pi);material=np.array(u['u_p1'])*(1-factor[...,None])+np.array(u['u_p2'])*factor[...,None];c=material*((.35+.65*diff)*ao)[...,None]+np.array(u['u_p4'])*spec[...,None]*.38;ink=(1-smooth(.009,.025,mark(screen[hit]*.9)))*u['u_emblem']*.35;c=c*(1-ink[...,None])+np.array(u['u_p4'])*(.4+.6*diff)[...,None]*ink[...,None];fog=1-np.exp(-t[hit]*.022);col[hit]=c*(1-fog[...,None])+background[hit]*fog[...,None]
 return col
images=[]
for scene in CONFIG['scenes']:
 u=scene['uniforms'];c,s=math.cos(u['u_rotation']),math.sin(u['u_rotation']);p=coordinates(P@np.array([[c,-s],[s,c]]),u);col=volume(p,u) if u['u_type']>=8 else shade(p,u);col=np.clip(np.nan_to_num(np.maximum(col,0)**.94),0,1);im=Image.fromarray((col*255).astype('uint8'));images.append(im);im.resize((384,216),Image.Resampling.LANCZOS).save(ROOT/'previews'/f"{scene['file']}.jpg",quality=90);print('Rendered',scene['file'],flush=True)
card=Image.new('RGB',(1200,630),'#101113');draw=ImageDraw.Draw(card);font_path='/System/Library/Fonts/Supplemental/Arial.ttf';font=ImageFont.truetype(font_path,46);small=ImageFont.truetype(font_path,18)
draw.text((40,29),'FRACTAL / LAB',font=font,fill='#f4eeea');draw.text((42,91),'10 WORLDS  /  SEAMLESS INFINITE ZOOM  /  2D + 3D',font=small,fill='#aaa3ae')
for index,box in [(0,(0,140,600,630)),(8,(600,140,900,630)),(9,(900,140,1200,630))]:card.paste(ImageOps.fit(images[index],(box[2]-box[0],box[3]-box[1]),method=Image.Resampling.LANCZOS),box[:2])
card.save(ROOT/'preview.jpg',quality=93,optimize=True)
sheet=Image.new('RGB',(1280,900),'#101113');draw=ImageDraw.Draw(sheet)
for i,im in enumerate(images):
 x=i%2*640;y=i//2*180;sheet.paste(im.resize((640,180)),(x,y));draw.text((x+12,y+12),f'{i+1:02d}',font=small,fill='white',stroke_width=2,stroke_fill='black')
sheet.save('/tmp/fractal-scenes.jpg',quality=90);print('Social preview saved: 1200x630',flush=True)
