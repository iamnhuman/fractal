"""Static artwork from the site's actual polynomial Julia and recursive 3D fields."""
import json, math, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
np.seterr(all='ignore')
ROOT=Path(__file__).resolve().parents[1]
CONFIG=json.loads(Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/fractal-render-config.json').read_text())
W,H=640,360
Y,X=np.mgrid[0:H,0:W]
P=np.stack((((X+.5)/W*2-1)*W/H,1-(Y+.5)/H*2),axis=-1)
def smooth(a,b,x):
 t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def palette(t,u):
 v=np.mod(t,1)*5;i=np.floor(v).astype(int);f=smooth(0,1,v-i)[...,None]
 colors=np.array([u['u_p'+str(j)] for j in range(5)])
 return colors[i%5]*(1-f)+colors[(i+1)%5]*f
def mark(x,y):
 return np.minimum(np.minimum(abs(np.hypot(x/.85,y/.56)-1)*.56,abs(np.hypot(x/.26,y/.56)-1)*.26),abs(np.hypot(x/.64,(y-.21)/.24)-1)*.24)
def field2(screen,u):
 q=np.array(u['u_center'])+screen*u['u_scale'];a=complex(*u['u_fixed']);inverse=complex(*u['u_chartInverse']);degree=u['u_degree']
 delta=(q[...,0]+1j*q[...,1])*inverse;derivative=np.full(delta.shape,inverse/max(abs(inverse),1e-30),dtype=complex)
 n=np.full(delta.shape,-u['u_depth'],dtype=float);active=np.ones(delta.shape,dtype=bool);escaped=np.zeros_like(active)
 for step in range(u['u_depth']+u['u_iterations']):
  if not active.any():break
  d=delta[active];z=a+d;derivative[active]*=degree*z**(degree-1);derivative[active]/=np.maximum(abs(derivative[active]),1e-30)
  total=np.ones_like(d);ap=1+0j
  for j in range(1,degree):ap*=a;total=total*z+ap
  delta[active]=d*total;n[active]+=1;z=a+delta;done=active&(np.maximum(abs(z.real),abs(z.imag))>64);escaped[done]=True;active[done]=False
 z=a+delta;log_r=np.log(np.maximum(abs(z),1.001));sn=n+1-np.log(np.maximum(log_r,1e-30))/math.log(degree)
 normal=z*derivative.conjugate()*complex(math.cos(u['u_rotation']),math.sin(u['u_rotation']));normal/=np.maximum(abs(normal),1e-30)
 light=.67+.33*(-.6*normal.real+normal.imag)/math.hypot(.6,1)
 col=palette(sn*.026+u['u_colorOffset']+u['u_phase'],u)
 col*=((1-u['u_relief'])+u['u_relief']*(.32+light*.9))[...,None];col+=np.array(u['u_p4'])*(np.maximum(light,0)**18*u['u_relief']*.18)[...,None]
 x=np.angle(z)/math.pi*1.15;y=np.mod(np.log(np.maximum(log_r,1e-30))/math.log(degree),1)*1.6-.8;ink=(1-smooth(.007,.023,mark(x,y)))*u['u_emblem']*.8*smooth(4,18,sn+u['u_orbitOffset'])
 col=col*(1-ink[...,None])+(np.array(u['u_p2'])*.65+np.array(u['u_p4'])*.35)*ink[...,None];col[~escaped]=np.array(u['u_p0'])*.72
 return col
def dist(p,typ):
 d=np.maximum(np.maximum(-p[...,0],-p[...,1]),-p[...,2]) if typ==9 else np.full(p.shape[:-1],-1e5)
 cell=6561.
 for _ in range(20):
  q=(p/cell+(1.5 if typ==8 else 0))%3;t=abs(q-1.5)-.5 if typ==8 else .5-abs(q-1.5);hole=np.maximum(np.minimum(t[...,0],t[...,1]),np.maximum(np.minimum(t[...,0],t[...,2]),np.minimum(t[...,1],t[...,2])))*cell;d=np.maximum(d,hole);cell/=3
 return d
def field3(screen,u):
 typ=u['u_type'];base=np.array([-3.2,2.6,3.8] if typ==9 else [3.2,2.6,3.8]);forward=-base/np.linalg.norm(base);right=np.cross(forward,[0,1,0]);right/=np.linalg.norm(right);up=np.cross(right,forward)
 ro=base*u['u_scale']+right*u['u_center'][0]+up*u['u_center'][1];rd=forward*2.8+screen[...,0,None]*right+screen[...,1,None]*up;rd/=np.linalg.norm(rd,axis=-1)[...,None]
 epsilon=max(.00002,u['u_scale']/H*.7);t=np.zeros((H,W));active=np.ones_like(t,dtype=bool);hit=np.zeros_like(active)
 for _ in range(144):
  if not active.any():break
  d=dist(ro+rd[active]*t[active,None],typ);done=d<epsilon;hit[active]=done;indices=np.where(active);t[indices]+=np.where(done,0,np.maximum(d*.8,epsilon*.2));active&=~hit;active&=t<=60*u['u_scale']
 col=np.empty((H,W,3));col[:]=np.array(u['u_p0'])*.65
 if hit.any():
  p=ro+rd[hit]*t[hit,None];e=epsilon*2;n=np.stack([dist(p+np.eye(3)[i]*e,typ)-dist(p-np.eye(3)[i]*e,typ) for i in range(3)],axis=-1);n/=np.maximum(np.linalg.norm(n,axis=-1)[...,None],1e-30);light=np.array([-.5,.9,1]);light/=np.linalg.norm(light);diff=np.maximum(n@light,0);ao=np.clip(dist(p+n*u['u_scale']*.06,typ)/(u['u_scale']*.06),.4,1);reflection=-light+2*(n@light)[...,None]*n;spec=np.maximum(np.sum(reflection*(-rd[hit]),axis=-1),0)**24
  radius=np.maximum(np.linalg.norm(p,axis=-1),epsilon);cycle=np.log(radius)/math.log(3);f=.65+.25*np.sin((cycle-u['u_colorOffset'])*1.256637+u['u_phase']*6.283185);material=np.array(u['u_p1'])*(1-f[...,None])+np.array(u['u_p2'])*f[...,None];c=material*((.35+.65*diff)*ao)[...,None]+np.array(u['u_p4'])*spec[...,None]*.38
  x=np.arctan2(p[...,1],p[...,0])/math.pi*1.2;y=np.mod(cycle,1)*1.6-.8;line=(1-smooth(.009,.025,mark(x,y)))*u['u_emblem']*.65;c=c*(1-line[...,None])+np.array(u['u_p4'])*(.4+.6*diff)[...,None]*line[...,None];fog=1-np.exp(-t[hit]/u['u_scale']*.018);col[hit]=c*(1-fog[...,None])+np.array(u['u_p0'])*fog[...,None]
 return col
images=[]
for scene in CONFIG['scenes']:
 u=scene['uniforms'];co,si=math.cos(u['u_rotation']),math.sin(u['u_rotation']);screen=P@np.array([[co,-si],[si,co]])
 col=field3(screen,u) if u['u_type']>=8 else field2(screen,u)
 col=np.clip(np.nan_to_num(np.maximum(col,0)**.94),0,1);im=Image.fromarray((col*255).astype('uint8'));images.append(im);im.resize((384,216),Image.Resampling.LANCZOS).save(ROOT/'previews'/f"{scene['file']}.jpg",quality=90);print('Rendered',scene['file'],flush=True)
card=Image.new('RGB',(1200,630),'#101113');draw=ImageDraw.Draw(card)
font_path='/System/Library/Fonts/Supplemental/Arial.ttf';font=ImageFont.truetype(font_path,46);small=ImageFont.truetype(font_path,18)
draw.text((40,29),'FRACTAL / LAB',font=font,fill='#f4eeea');draw.text((42,91),'10 WORLDS  /  SELF-SIMILAR EXPLORATION  /  2D + 3D',font=small,fill='#aaa3ae')
for index,box in [(0,(0,140,600,630)),(8,(600,140,900,630)),(9,(900,140,1200,630))]:card.paste(ImageOps.fit(images[index],(box[2]-box[0],box[3]-box[1]),method=Image.Resampling.LANCZOS),box[:2])
card.save(ROOT/'preview.jpg',quality=93,optimize=True)
sheet=Image.new('RGB',(1280,900),'#101113');draw=ImageDraw.Draw(sheet)
for i,im in enumerate(images):
 x=i%2*640;y=i//2*180;sheet.paste(im.resize((640,180)),(x,y));draw.text((x+12,y+12),f'{i+1:02d}',font=small,fill='white',stroke_width=2,stroke_fill='black')
sheet.save('/tmp/fractal-scenes.jpg',quality=90);print('Social preview saved: 1200x630',flush=True)
