import numpy as np, math, sys
from PIL import Image, ImageDraw
from scipy import ndimage, optimize
im=np.asarray(Image.open('/home/claude/Fig.3D/site/assets/silicon-nanowire/figure-5.jpeg').convert('RGB')).astype(int)
a=im[:310,:420];sat=a.max(2)-a.min(2);mask=sat>60
mask[:150,:175]=False;mask[140:,335:]=False
mask=ndimage.binary_closing(mask,iterations=3);mask=ndimage.binary_fill_holes(mask)
lab,n=ndimage.label(mask);sizes=ndimage.sum(mask,lab,range(1,n+1));mask=lab==(1+np.argmax(sizes))
Image.fromarray((mask*255).astype('uint8')).save('mask.png')
ys,xs=np.nonzero(mask);print('target bbox',xs.min(),xs.max(),ys.min(),ys.max(),'area',mask.sum())
def smooth(a,b,v):
    t=min(1,max(0,(v-a)/(b-a)));return t*t*(3-2*t)
def section(p,s,L):
    q=smooth(0,.65,1.7*p-s);A=1+1.62*q;N=.34*smooth(.35,.95,q)
    th=np.linspace(0,math.pi,81);yy=np.sin(th)*(1-N*np.exp(-((np.cos(th)/.34)**2)));B=(1+.14*q)/yy.max()
    return A,B,N,L*(.5-s)
def surface(p,L,R=64,Ax=40):
    pts=[]
    for j in range(Ax+1):
        A,B,N,z=section(p,j/Ax,L);th=np.linspace(0,2*math.pi,R,endpoint=False)
        x=A*np.cos(th);y=B*np.sin(th)*(1-N*np.exp(-((np.cos(th)/.34)**2)))
        pts.append(np.stack([x,y,np.full(R,z)],1))
    return np.array(pts)  # Ax+1,R,3
def render(P,yaw,el,k,tx,ty,shape):
    cy,sy,ce,se=math.cos(yaw),math.sin(yaw),math.cos(el),math.sin(el)
    right=np.array([cy,0,-sy]);up=np.array([-sy*se,ce,-cy*se])
    X=P@right*k+tx;Y=-(P@up)*k+ty
    img=Image.new('L',(shape[1],shape[0]),0);d=ImageDraw.Draw(img)
    Ax,R=X.shape
    for j in range(Ax-1):
        for i in range(R):
            i2=(i+1)%R;d.polygon([(X[j,i],Y[j,i]),(X[j,i2],Y[j,i2]),(X[j+1,i2],Y[j+1,i2]),(X[j+1,i],Y[j+1,i])],fill=255)
    for j in (0,Ax-1): d.polygon(list(zip(X[j],Y[j])),fill=255)
    return np.asarray(img)>0
cache={}
def cost(v):
    yaw,el,k,tx,ty,p,L=v
    key=(round(p,3),round(L,2))
    if key not in cache: cache[key]=surface(p,L)
    m=render(cache[key],yaw,el,k,tx,ty,mask.shape)
    inter=(m&mask).sum();uni=(m|mask).sum();return 1-inter/uni
best=None
for p in [.4,.45,.5,.55]:
  for L in [9,10,11,12]:
    for yaw in [.45,.6,.75,.9]:
      for el in [.3,.45,.6]:
        # set scale/translation from bbox
        P=surface(p,L);cy,sy,ce,se=math.cos(yaw),math.sin(yaw),math.cos(el),math.sin(el)
        right=np.array([cy,0,-sy]);up=np.array([-sy*se,ce,-cy*se]);X=P@right;Y=-(P@up)
        k=(xs.max()-xs.min())/(X.max()-X.min());tx=xs.min()-X.min()*k;ty=ys.min()-Y.min()*k
        c=cost([yaw,el,k,tx,ty,p,L])
        if best is None or c<best[0]: best=(c,[yaw,el,k,tx,ty,p,L])
print('grid',best)
r=optimize.minimize(cost,best[1],method='Nelder-Mead',options={'maxiter':600,'xatol':1e-3,'fatol':1e-5,'initial_simplex':None})
print('opt',r.fun,list(r.x))
yaw,el,k,tx,ty,p,L=r.x
m=render(surface(p,L),yaw,el,k,tx,ty,mask.shape)
out=np.zeros(mask.shape+(3,),np.uint8);out[...,0]=mask*255;out[...,1]=m*255;Image.fromarray(out).save('overlay.png')

# refit with L=9 fixed, p=.45 fixed
def cost2(v):return cost([v[0],v[1],v[2],v[3],v[4],.45,9.0])
r2=optimize.minimize(cost2,[r.x[0],r.x[1],r.x[2],r.x[3],r.x[4]],method='Nelder-Mead',options={'maxiter':500})
print('fixed L=9 p=.45',r2.fun,list(r2.x))
yaw,el,k,tx,ty=r2.x
m=render(surface(.45,9.0),yaw,el,k,tx,ty,mask.shape)
out=np.zeros(mask.shape+(3,),np.uint8);out[...,0]=mask*255;out[...,1]=m*255;Image.fromarray(out).save('overlay9.png')
P=surface(.45,9.0);cy,sy,ce,se=math.cos(yaw),math.sin(yaw),math.cos(el),math.sin(el)
right=np.array([cy,0,-sy]);up=np.array([-sy*se,ce,-cy*se]);X=P@right*k+tx;Y=-(P@up)*k+ty
print('model bbox native',X.min(),Y.min(),X.max(),Y.max())
