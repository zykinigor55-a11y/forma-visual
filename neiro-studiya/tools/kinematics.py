"""Нейро студия — Quantum Kinetic V4: параметры ключевой 3D-анимации.

Камера полностью неподвижна; никакого масштабирования всей сферы.
Параметры соответствуют локальной визуализации V4 (1024px source art).
"""
import math
from dataclasses import dataclass

DURATION=8.0
FPS=30
OUTPUT_SIZE=(1920,1080)
SPHERE_SOURCE_SIZE=(1024,1024)
SPHERE_DISPLAY_SIZE=730
# (название, смещение на максимальном раскрытии, XYZ углы в градусах)
PETALS=[
    ("UL",(-43.0,-34.0),(-13.0,19.5,-3.6)),
    ("UR",(41.0,-34.0),(-14.5,-18.0,3.7)),
    ("LL",(-46.0,18.0),(13.0,18.5,-4.2)),
    ("RIGHT",(47.0,12.0),(2.0,-21.5,3.9)),
    ("BOTTOM",(0.0,43.0),(20.0,2.0,1.6)),
]
def ease(a,b,x):
    u=max(0.0,min(1.0,(x-a)/(b-a)))
    return u*u*(3.0-2.0*u)
def envelope(t):
    """0 at seam, nearly 1 at 3.3–4.8 sec, back to 0 near 7.65 sec."""
    return ease(.35,3.3,t)*(1.0-ease(4.8,7.65,t))
def panel_pose(panel_index,time_seconds):
    name,move,angles=PETALS[panel_index]
    phase=envelope(time_seconds)
    stagger=.85+.15*math.cos(2*math.pi*(time_seconds/DURATION)-panel_index*.57)
    strength=phase*stagger
    return {
        "name":name,
        "translation":tuple(v*strength for v in move),
        "rotation_degrees":tuple(v*strength for v in angles),
    }
def ring_rotation(time_seconds):
    opening=envelope(time_seconds)
    return (10.0*opening,-8.0*opening)
def core_brightness(time_seconds):
    amount=envelope(time_seconds)
    return 1.0 + 0.2*amount*(0.45+0.55*math.sin(2*math.pi*time_seconds/DURATION)**2)

if __name__=="__main__":
    for t in (0,1,2,3,4,5,6,7,8):
        print(t,round(envelope(t),3),panel_pose(0,t),ring_rotation(t))
