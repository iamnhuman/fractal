"""Check actual offscreen shader pixels; no browser is opened or captured."""
from pathlib import Path
from statistics import pstdev
import sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp')
def read(name):
 header=(root/name).read_bytes().split(b'\n',3)
 width,height=map(int,header[1].split());data=header[3]
 assert len(data)==width*height*3,name
 return width,height,data
worst_seam=0
for scene in range(1,11):
 assert read(f'{scene:02}-start.ppm')==read(f'{scene:02}-repeat.ppm'),f'Scene {scene}: cycle changed pixels'
 _,_,before=read(f'{scene:02}-seam-before.ppm');_,_,after=read(f'{scene:02}-seam-after.ppm')
 delta=[abs(a-b) for a,b in zip(before,after)];mean=sum(delta)/len(delta);worst_seam=max(worst_seam,mean)
 assert mean<.8 and sum(d>12 for d in delta)/len(delta)<.025,f'Scene {scene}: visible jump at the phase seam'
print('All 10 shader frames repeat pixel for pixel after one zoom cycle.')
print(f'All 10 phase seams join continuously; maximum average channel difference {worst_seam:.3f}/255.')
frames=list(root.glob('[0-9][0-9]-phase-*.ppm'));worst_global=1e9;worst_center=1e9
for file in frames:
 width,height,data=read(file.name);pixels=[sum(data[i:i+3])/3 for i in range(0,len(data),3)]
 center=[pixels[y*width+x] for y in range(height//4,3*height//4) for x in range(width//4,3*width//4)]
 whole,detail=pstdev(pixels),pstdev(center);worst_global=min(worst_global,whole);worst_center=min(worst_center,detail)
 assert whole>8 and detail>5,f'{file.name}: camera reached an empty frame'
 # Quiet backgrounds are intentional in 3D; they must surround a substantial
 # visible structure rather than a tiny object floating on an empty screen.
 occupied=0
 for gy in range(4):
  for gx in range(4):
   tile=[pixels[y*width+x] for y in range(gy*height//4,(gy+1)*height//4) for x in range(gx*width//4,(gx+1)*width//4)]
   occupied+=pstdev(tile)>1
 assert occupied>=8,f'{file.name}: geometry occupies too little of the viewport'
if frames:
 assert len(frames)==80,f'Expected 80 intermediate frames, found {len(frames)}'
 for scene in range(1,11):
  _,_,first=read(f'{scene:02}-phase-0.ppm');_,_,middle=read(f'{scene:02}-phase-4.ppm')
  assert sum(abs(a-b) for a,b in zip(first,middle))/len(first)>3,f'Scene {scene}: zoom is visually static'
 print(f'80 intermediate frames retain visible structure; minimum frame/centre std {worst_global:.2f}/{worst_center:.2f}.')
