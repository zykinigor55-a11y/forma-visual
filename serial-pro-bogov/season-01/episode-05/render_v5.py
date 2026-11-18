#!/usr/bin/env python3
"""Episode 05 V5: real-image-traced energy flow, brief microlightning and subtle atmosphere.
Uses source PNGs, not copies of previous videos; no faux geometry, no discontinuous camera.
Requires Python/OpenCV/NumPy/SciPy/scikit-image/FFmpeg.
"""
import os,sys,math,time,subprocess
from collections import deque
from pathlib import Path
import numpy as np,cv2
from scipy.ndimage import distance_transform_edt
from skimage.morphology import skeletonize
cv2.setNumThreads(2)
ROOT=Path('/mnt/data')
DIR=ROOT/'EP05_PREMIUM_V5'
DIR.mkdir(exist_ok=True)
FILES=sorted(x for x in (ROOT/'DO_SOTVORENIYA_EP05_10_IMAGES').glob('[0-9][0-9]_*.png') if '%' not in x.name)
assert len(FILES)==10, FILES
W,H,FPS=900,1600,24
SW,SH=450,800
TIMES=[0,17,36,52,72,91,111,131,151,169,190]
CAM=[(.040,.008,1.04,1.145),(-.034,-.004,1.05,1.135),(.026,-.012,1.045,1.13),(.015,.009,1.03,1.112),(-.034,.007,1.04,1.134),(.030,-.009,1.045,1.12),(-.03,.004,1.04,1.122),(.020,-.018,1.05,1.138),(-.012,.012,1.07,1.145),(.0,.0,1.04,1.17)]

def build_contours(im, gold):
    hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV)
    h,s,v=cv2.split(hsv)
    gray=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
    contrast=cv2.subtract(gray,cv2.GaussianBlur(gray,(0,0),5))
    if gold:
        m=np.uint8((h>=6)&(h<=40)&(s>=43)&(v>=110)&((contrast>5)|(v>176)))
    else:
        m=np.uint8((h>=84)&(h<=130)&(s>=45)&(v>=144)&((contrast>8)|(v>195)))
    m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
    n, labs, stats, cent = cv2.connectedComponentsWithStats(m,8)
    keep=np.zeros_like(m)
    for j in range(1,n):
        if stats[j,cv2.CC_STAT_AREA]>=9:
            keep[labs==j]=1
    # Actual curved structures in source image, not freehand paths.
    thin=skeletonize(keep.astype(bool)).astype('uint8')
    n2, segs, stat2, cen2=cv2.connectedComponentsWithStats(thin,8)
    path_phase=np.zeros((SH,SW),np.float32)
    skel_keep=np.zeros((SH,SW),np.uint8)
    rng=np.random.default_rng(123 if gold else 432)
    for label in range(1,n2):
        if stat2[label,cv2.CC_STAT_AREA]<9: continue
        x,y,w,h,area=stat2[label]
        if area>4000: continue
        sub=(segs[y:y+h,x:x+w]==label)
        ys,xs=np.where(sub)
        if len(xs)==0:continue
        # Start at extreme point; geodesic distance follows each bending contour.
        k=np.argmin(xs + ys*.4)
        start=(int(ys[k]),int(xs[k]))
        dist=np.full((h,w),-1,np.int32)
        dist[start]=0
        q=deque([start])
        while q:
            cy,cx=q.popleft();d=dist[cy,cx]+1
            for yy in range(max(0,cy-1),min(h,cy+2)):
                for xx in range(max(0,cx-1),min(w,cx+2)):
                    if sub[yy,xx] and dist[yy,xx]<0:
                        dist[yy,xx]=d; q.append((yy,xx))
        dmax=dist[ys,xs].max()
        if dmax<7:continue
        reg=path_phase[y:y+h,x:x+w]
        reg[ys,xs]=(dist[ys,xs].astype(np.float32)+rng.uniform(0,220))
        skel_keep[y:y+h,x:x+w][ys,xs]=1
    if not skel_keep.any():return np.zeros((SH,SW),np.float32), np.zeros((SH,SW),np.float32),np.zeros((SH,SW),np.uint8)
    # Map each nearby glow-pixel to its nearest on-path distance.
    _, idx=distance_transform_edt(~skel_keep.astype(bool),return_indices=True)
    path=path_phase[idx[0],idx[1]]
    path=cv2.GaussianBlur(path,(0,0),.6)
    mask=cv2.GaussianBlur(keep.astype(np.float32),(0,0),.8)
    # On-path intensity follows the actual illuminated paint geometry.
    mask=np.minimum(1,mask*1.45)
    return mask,path,skel_keep

class Scene:
    def __init__(self,i,f):
        self.i=i
        original=cv2.imread(str(f),cv2.IMREAD_COLOR)
        assert original is not None, str(f)
        self.img=cv2.resize(original,(W,H),interpolation=cv2.INTER_AREA)
        low=cv2.resize(original,(SW,SH),interpolation=cv2.INTER_AREA)
        self.goldmask,self.goldpath,self.gs=build_contours(low,True)
        self.bluemask,self.bluepath,self.bs=build_contours(low,False)
        # Build very faint broad background mist — no obscured subject and no invented glass.
        g=cv2.cvtColor(low,cv2.COLOR_BGR2GRAY).astype('float32')
        rng=np.random.default_rng(815+i*197)
        small=rng.normal(0,1,(40,23)).astype('float32')
        small=cv2.GaussianBlur(small,(0,0),2.7)
        small=(small-small.min())/(small.max()-small.min()+1e-6)
        haze=cv2.resize(small,(SW,SH),interpolation=cv2.INTER_CUBIC)
        shade=np.clip((95-g)/105,0,1)
        self.haze=np.uint8(np.clip((haze-.38)*20*shade,0,9))
        self.dust=np.column_stack([rng.uniform(0,W,90),rng.uniform(0,H,90),rng.uniform(.2,1,90),rng.uniform(0,math.tau,90)])
        # Fixed glint coordinates chosen only from the original actual highlighted contours.
        self.flashes=[]
        pathpoints=np.column_stack(np.where(self.gs>0)).astype('float32')
        if len(pathpoints):
            valid=pathpoints[(pathpoints[:,0]>50)&(pathpoints[:,0]<SH-70)]
            if len(valid)==0: valid=pathpoints
            for j in range(12):
                y,x=valid[rng.integers(len(valid))]
                self.flashes.append((float(x),float(y),1.0+j*.81+float(rng.uniform(0,.6))))
        self.overlay=np.zeros((H,W,3),np.uint8)

    def cam_matrix(self,t):
        start,end=TIMES[self.i],TIMES[self.i+1]
        u=float(np.clip((t-start)/(end-start),0,1));e=u*u*(3-2*u)
        px,py,z0,z1=CAM[self.i]
        zoom=z0+(z1-z0)*e
        dx=px*W*(e-.5);dy=py*H*(e-.5)
        return u, np.float32([[zoom,0,(1-zoom)*W*.5+dx],[0,zoom,(1-zoom)*H*.5+dy]])

    def flow(self,t):
        local=t-TIMES[self.i]
        def make(mask,path,slow):
            if not mask.any():return np.zeros_like(mask,dtype=np.uint8)
            # Two slim luminous heads moving geodesically along each highlighted stroke.
            period=110.0
            r=np.mod(path-local*slow,period)
            dist=np.minimum(r,period-r)
            main=np.exp(-((dist/13.0)**2))*0.92
            r2=np.mod(path-local*slow-38,period)
            d2=np.minimum(r2,period-r2)
            trail=np.exp(-((d2/19)**2))*.24
            shimmer=0.08+0.07*math.sin(local*.39+self.i)
            return np.uint8(np.clip(mask*(main+trail+shimmer)*255,0,255))
        gold=make(self.goldmask,self.goldpath,14)
        blue=make(self.bluemask,self.bluepath,11)
        # Rare 2–4 frame microdischarges confined to already highlighted geometry.
        for x,y,event in self.flashes:
            gap=2.9
            elapsed=(local-event)%gap
            if elapsed>4/FPS:continue
            # Existing gold stroke, no newly drawn lightning branch.
            r=5+int(3*math.sin(elapsed*FPS*.6))
            bx=int(x);by=int(y)
            x0=max(0,bx-r);x1=min(SW,bx+r+1);y0=max(0,by-r);y1=min(SH,by+r+1)
            patch=self.goldmask[y0:y1,x0:x1]
            if patch.size:
                yy,xx=np.ogrid[y0:y1,x0:x1]
                boost=np.exp(-((xx-bx)**2+(yy-by)**2)/(2*max(2,r/1.7)**2))*220*(1-elapsed*FPS/5)
                gold[y0:y1,x0:x1]=np.maximum(gold[y0:y1,x0:x1],np.uint8(np.clip(boost*patch,0,255)))
        return gold,blue

    def render(self,t):
        u,M=self.cam_matrix(t)
        base=cv2.warpAffine(self.img,M,(W,H),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT_101)
        gold,blue=self.flow(t)
        # FX at half resolution; upscale once and move with same camera as source.
        color=np.zeros((SH,SW,3),np.uint8)
        color[:,:,0]=cv2.add(cv2.multiply(gold,.34),cv2.multiply(blue,.87))
        color[:,:,1]=cv2.add(cv2.multiply(gold,.77),cv2.multiply(blue,.62))
        color[:,:,2]=cv2.add(cv2.multiply(gold,.98),cv2.multiply(blue,.28))
        color=cv2.resize(color,(W,H),interpolation=cv2.INTER_LINEAR)
        aligned=cv2.warpAffine(color,M,(W,H),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
        base=cv2.addWeighted(base,1.0,aligned,.76,0)
        # Carefully limited local glow from the same light paths.
        halo=cv2.GaussianBlur(aligned,(0,0),7)
        base=cv2.addWeighted(base,1.0,halo,.24,0)
        # Near-invisible nebula in the dark image; low-frequency drift, no big bright clouds.
        tx=int(5*math.sin(u*2+self.i));ty=int(7*math.cos(u*1.6+self.i))
        haze=cv2.warpAffine(self.haze,np.float32([[1,0,tx],[0,1,ty]]),(SW,SH),borderMode=cv2.BORDER_REFLECT_101)
        haze=cv2.resize(haze,(W,H),interpolation=cv2.INTER_LINEAR)
        base[:,:,0]=cv2.add(base[:,:,0],haze)
        base[:,:,1]=cv2.add(base[:,:,1],cv2.multiply(haze,.41))
        # 90 almost imperceptible dust motes; two depth speeds.
        for x0,y0,depth,phase in self.dust:
            x=int((x0+u*21*depth+2*math.sin(u*2+phase))%W)
            y=int((y0-u*30*depth+2*math.cos(u*1.7+phase))%H)
            a=int(20+36*depth)
            cv2.circle(base,(x,y),1,(a,int(a*.83),int(a*.70)),-1,lineType=cv2.LINE_AA)
        # Transition fades around scene boundaries only (no jump-cut zoom).
        start,end=TIMES[self.i],TIMES[self.i+1]
        opacity=min(1,(t-start)/.52,(end-t)/.52)
        if self.i==0:opacity=min(opacity,(t-start)/1.0)
        if self.i==9:opacity=min(opacity,(end-t)/1.45)
        if opacity<1: base=cv2.convertScaleAbs(base,alpha=max(0,float(opacity)))
        return base

def main():
    begin=time.monotonic()
    print('Preparing traced paths...',flush=True)
    scenes=[Scene(i,f) for i,f in enumerate(FILES)]
    print('Gold paths: ',[int(s.gs.sum()) for s in scenes],flush=True)
    n=int(os.getenv('FRAMES',str(TIMES[-1]*FPS)))
    start_frame=int(os.getenv('START_FRAME','0'))
    out=Path(os.getenv('DEST',str(DIR/'EP05_V5_VIDEO_ONLY_900x1600.mp4')))
    ff=['ffmpeg','-hide_banner','-nostdin','-loglevel','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(out)]
    p=subprocess.Popen(ff,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    old=-1
    try:
        for k in range(n):
            f=start_frame+k; t=f/FPS
            si=min(9,np.searchsorted(TIMES,t,side='right')-1)
            if si!=old:print(f'SCENE {si+1:02d}, t={t:.1f}s',flush=True);old=si
            frame=scenes[si].render(t)
            p.stdin.write(frame.tobytes())
            if k%240==239: print('PROGRESS',k+1,'/',n,'seconds',round(time.monotonic()-begin),flush=True)
        p.stdin.close();err=p.stderr.read().decode(errors='replace');rc=p.wait()
        print('DONE',rc,out,'elapsed',round(time.monotonic()-begin),'error',err[-300:],flush=True)
        if rc!=0:sys.exit(rc)
    except BaseException:
        p.kill();raise

if __name__=='__main__': main()