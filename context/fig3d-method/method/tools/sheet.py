import sys
from PIL import Image
out,cols,scale,*files=sys.argv[1:];cols=int(cols);s=float(scale)
ims=[Image.open(f).convert('RGB') for f in files]
w=max(i.width for i in ims);h=max(i.height for i in ims)
W,H=int(w*s),int(h*s)
rows=(len(ims)+cols-1)//cols
sheet=Image.new('RGB',(W*cols,H*rows),(60,60,60))
for k,i in enumerate(ims):
  i=i.resize((int(i.width*s),int(i.height*s)))
  sheet.paste(i,((k%cols)*W,(k//cols)*H))
sheet.save(out)
