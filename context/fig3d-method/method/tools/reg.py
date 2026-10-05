import numpy as np, itertools
from PIL import Image, ImageDraw, ImageFont
F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
fig=Image.open('/home/claude/Fig.3D/site/assets/self-separating-battery/figure-1.jpg').convert('RGB')
# measured hull vertices in native figure px
M={'left top':(937,112),'left bottom':(937,319),'front top':(1106,155),'front bottom':(1106,364),'right top':(1245,103),'right bottom':(1245,310),'back top':(1082,56)}
yaw,el=0.70,0.31
s,c=np.sin(yaw),np.cos(yaw);se,ce=np.sin(el),np.cos(el)
right=np.array([c,0,-s]);up=np.array([-s*se,ce,-c*se])
V={k:np.array(k) for k in itertools.product([-1,1],repeat=3)}
P={k:(v@right,-(v@up)) for k,v in V.items()}
# visible corners: camera forward=(s ce, se, c ce): front corner is (+1,+1? ) choose by max dot
fwd=np.array([s*ce,se,c*ce])
front=max(V,key=lambda k:V[k]@fwd)  # nearest top corner
# map model corners to named hull points
fx,fy,fz=front
name={ (fx,1,fz):'front top',(fx,-1,fz):'front bottom',(-fx,1,fz):'left top',(-fx,-1,fz):'left bottom',(fx,1,-fz):'right top',(fx,-1,-fz):'right bottom',(-fx,1,-fz):'back top'}
# check orientation: left should have smaller x
pairs=[(P[k],M[n]) for k,n in name.items()]
A=[];b=[]
for (px,py),(mx,my) in pairs:
  A.append([px,1,0]);b.append(mx);A.append([py,0,1]);b.append(my)
sol,res,*_=np.linalg.lstsq(np.array(A),np.array(b),rcond=None)
k,tx,ty=sol
err=[np.hypot(k*px+tx-mx,k*py+ty-my) for (px,py),(mx,my) in pairs]
print('scale px/unit',k,'rms err px',np.sqrt(np.mean(np.square(err))),'max',max(err))
for (kk,n) in name.items(): print(n, M[n], (round(k*P[kk][0]+tx,1),round(k*P[kk][1]+ty,1)))
x0,y0,x1,y1=900,30,1270,395;S=2.4
im=fig.crop((x0,y0,x1,y1)).resize((int((x1-x0)*S),int((y1-y0)*S)),Image.LANCZOS)
im=Image.eval(im,lambda v:int(v*0.55+20))
d=ImageDraw.Draw(im)
T=lambda x,y:((x-x0)*S,(y-y0)*S)
G=(40,200,120);A_=(255,150,0)
for a,bb in itertools.combinations(V,2):
  if sum(abs(np.array(a)-np.array(bb)))==2:
    hidden = a not in name or bb not in name
    pa=T(k*P[a][0]+tx,k*P[a][1]+ty);pb=T(k*P[bb][0]+tx,k*P[bb][1]+ty)
    if hidden: continue
    d.line([pa,pb],fill=G,width=3)
for n,(mx,my) in M.items():
  X,Y=T(mx,my);d.ellipse([X-7,Y-7,X+7,Y+7],outline=A_,width=3)
f=ImageFont.truetype(F,20);fb=ImageFont.truetype(B,20)
def lab(x,y,t,col=(20,20,30)):
  X,Y=T(x,y);bb=d.textbbox((X,Y),t,font=fb);d.rectangle([bb[0]-5,bb[1]-4,bb[2]+5,bb[3]+4],fill=(255,255,255));d.text((X,Y),t,font=fb,fill=col)
# face widths
for (a_,b_,yy,t) in [(937,1106,385,'169 px'),(1106,1245,385,'140 px')]:
  d.line([T(a_,yy),T(b_,yy)],fill=A_,width=3)
  for e in (a_,b_): d.line([T(e,yy-4),T(e,yy+4)],fill=A_,width=3)
  lab((a_+b_)/2-14,yy-17,t,(160,80,0))
lab(940,80,'rise 43 over 169',(160,80,0));lab(1150,75,'rise 51 over 140',(160,80,0))
im.save('reg-core.png')
W,H=im.width+60,im.height+330
cv=Image.new('RGB',(W,H),(11,14,21));cv.paste(im,(30,80));D=ImageDraw.Draw(cv)
D.text((30,25),'07 · Registration: measure, solve, check the residual',font=ImageFont.truetype(B,26),fill=(232,237,248))
import textwrap
txt=('Orange rings: hull corners measured on the native 1276 x 414 figure. Green: the model cube projected with PAPER_POSE '
 f'(yaw 0.70, elevation 0.31) plus a least-squares scale and offset. RMS error {np.sqrt(np.mean(np.square(err))):.1f} px, worst {max(err):.1f} px at the back top corner, where the printed edge is soft. '
 'Yaw from face widths: tan(yaw) = 140/169, yaw = 0.69. Elevation from edge slopes: left 43/169 = tan(yaw) sin(el) gives 0.312; '
 'right 51/140 = sin(el)/tan(yaw) gives 0.306. Two independent estimates agreeing to 0.006 rad is the check that the print is orthographic.')
lines=textwrap.wrap(txt,86)
for i,l in enumerate(lines): D.text((30,im.height+100+i*28),l,font=ImageFont.truetype(F,19),fill=(232,237,248))
cv.save('/mnt/project-files/fig3d-review/interwoven-battery/method/07-registration.jpg',quality=92)
