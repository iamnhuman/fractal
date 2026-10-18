"""Package artwork rendered by the SAME shaders as the live website.
Usage: python3 scripts/render-preview.py /path/to/rendered-ppm-directory
No approximate CPU recreation of a different fractal is used for thumbnails.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
import sys
ROOT=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/fractal-renders')
images=[]
for index in range(1,11):
 image=Image.open(source/f'{index:02}.ppm').convert('RGB');images.append(image)
 image.resize((384,216),Image.Resampling.LANCZOS).save(ROOT/'previews'/f'{index:02}.jpg',quality=93,optimize=True)
font_path=Path('/System/Library/Fonts/Supplemental/Arial.ttf')
font=ImageFont.truetype(str(font_path),46) if font_path.exists() else ImageFont.load_default(size=46)
small=ImageFont.truetype(str(font_path),18) if font_path.exists() else ImageFont.load_default(size=18)
card=Image.new('RGB',(1200,630),'#101113');draw=ImageDraw.Draw(card)
draw.text((40,29),'FRACTAL / LAB',font=font,fill='#f4eeea')
draw.text((42,91),'10 WORLDS  /  SEAMLESS INFINITE ZOOM  /  2D + 3D',font=small,fill='#aaa3ae')
for index,box in [(0,(0,140,740,630)),(6,(740,140,1200,385)),(9,(740,385,1200,630))]:
 card.paste(ImageOps.fit(images[index],(box[2]-box[0],box[3]-box[1]),method=Image.Resampling.LANCZOS),box[:2])
card.save(ROOT/'preview.jpg',quality=94,optimize=True)
sheet=Image.new('RGB',(1280,1800),'#101113');draw=ImageDraw.Draw(sheet)
for i,image in enumerate(images):
 x=i%2*640;y=i//2*360;sheet.paste(image.resize((640,360),Image.Resampling.LANCZOS),(x,y))
 draw.text((x+12,y+12),f'{i+1:02d}',font=small,fill='white',stroke_width=2,stroke_fill='black')
sheet.save(source/'contact.jpg',quality=94)
print('Saved 10 shader-matched thumbnails and 1200x630 social preview.')
