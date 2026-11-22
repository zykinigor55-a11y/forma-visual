"""Нейро студия — Quantum Kinetic V5: параметры анимации (8 секунд).

Эти функции фиксируют кинематику. Полный рендерер, аудио и GLB находятся
в архиве Neiro_Studiya_Quantum_Kinetic_V5_Complete.zip.
"""
import math
from dataclasses import dataclass

FPS=30
DURATION=8.0
FRAME_SIZE=(1920,1080)
SPHERE_SIZE_PX=790
MOTIONS=[
    ("UL", (-50.0,-43.0), (-16.0,23.0,-4.2)),
    ("UR", (48.0,-41.0), (-17.0,-22.0,4.1)),
    ("LL", (-55.0,21.0), (16.0,22.0,-4.9)),
    ("RIGHT", (55.0,16.0), (2.5,-24.0,4.7)),
    ("BOTTOM", (0.0,51.0), (23.0,2.0,2.0)),
]

def ease(a,b,x):
    u=max(0.0,min(1.0,(x-a)/(b-a)))
    return u*u*(3-2*u)

def petal_amount(index,time_seconds):
    # Each actuator starts individually; closure order is reversed.
    opened=ease(.35+.115*index,2.65+.12*index,time_seconds)
    closed=ease(5.00+.065*(4-index),7.55-.012*index,time_seconds)
    return opened*(1.0-closed)

def pose(index,time_seconds):
    name,delta,rotation=MOTIONS[index]
    k=petal_amount(index,time_seconds)
    return {
        "name":name,
        "translation_source_pixels":(delta[0]*k,delta[1]*k),
        "rotation_xyz_degrees":tuple(q*k for q in rotation),
    }

def ring_angles(time_seconds):
    k=ease(.35,2.95,time_seconds)*(1-ease(5.05,7.6,time_seconds))
    return (18.0*k,-14.5*k)

def camera_state(time_seconds):
    # Constant framing is deliberate: no zoom, dolly or object scaling.
    return {"position":(0,0,4.4),"focal_length":50,"zoom":1.0,"target":(0,0,0)}

if __name__=="__main__":
    for second in [0.,1.,2.,3.,4.,5.,6.,7.,8.]:
        print(second,[round(petal_amount(i,second),3) for i in range(5)],ring_angles(second))
