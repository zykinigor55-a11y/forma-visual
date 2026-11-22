"""NEIRO STUDIO / FORMA AI — Quantum Kinetic V10 timing reference.

Full V10 geometry/animation renderer and WAV generator are in the downloadable
Neiro_Studiya_Quantum_Kinetic_V10_Complete.zip archive.
No camera zoom: the processor stays forward-facing throughout.
"""
from math import pi

DURATION=8.0
FPS=30
CAMERA_LOCKED=True
INNER_RING_DEGREES=-53.0
OUTER_RING_DEGREES=74.0


def smoothstep01(x):
    x=min(1.0,max(0.0,x))
    return x*x*(3.0-2.0*x)


def ring_progress(seconds,outer=True):
    start,end=(1.00,4.07) if outer else (1.40,4.35)
    opening=smoothstep01((seconds-start)/(end-start))
    closing=smoothstep01((seconds-5.08)/(7.75-5.08))
    return opening*(1.0-closing)


def ring_angle_degrees(seconds,outer=True):
    amplitude=OUTER_RING_DEGREES if outer else INNER_RING_DEGREES
    return amplitude*ring_progress(seconds,outer)


def petal_progress(seconds,index):
    assert 0<=index<5
    start=.48+index*.12
    finish=2.65+index*.12
    retract=5.02+(4-index)*.06
    seal=7.5-index*.008
    return smoothstep01((seconds-start)/(finish-start))*(1-smoothstep01((seconds-retract)/(seal-retract)))

if __name__=='__main__':
    for second in (0,1,2,3,4,5,6,7,8):
        print(second,round(ring_angle_degrees(second,True),2),round(ring_angle_degrees(second,False),2))
