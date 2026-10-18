"""Check actual headless shader output; this does not open or capture a browser."""
from pathlib import Path
from statistics import pstdev
import sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp')
for scene in range(1,11):
 a=(root/f'{scene:02}-start.ppm').read_bytes();b=(root/f'{scene:02}-repeat.ppm').read_bytes()
 assert a==b,f'Scene {scene}: full zoom cycle changed pixels'
print('All 10 shader frames repeat pixel for pixel after one zoom cycle.')
frames=list(root.glob('[0-9][0-9]-phase-*.ppm'))
if frames:
 worst=1e9
 for file in frames:
  header=file.read_bytes().split(b'\n',3);width,height=map(int,header[1].split());data=header[3]
  assert len(data)==width*height*3,file
  for gy in range(4):
   for gx in range(4):
    values=[]
    for y in range(gy*height//4,(gy+1)*height//4):
     for x in range(gx*width//4,(gx+1)*width//4):
      i=(y*width+x)*3;values.append((data[i]+data[i+1]+data[i+2])/3)
    deviation=pstdev(values);worst=min(worst,deviation)
    assert deviation>1,f'{file.name}: flat empty tile {gx},{gy}, std={deviation:.3f}'
 print(f'{len(frames)} intermediate shader frames have detail in every tested tile; minimum std {worst:.2f}.')
