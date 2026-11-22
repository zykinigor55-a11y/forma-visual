#!/usr/bin/env python3
"""Нейро студия — синтез собственного звука для Quantum Kinetic, 8 с / 48 кГц."""
from pathlib import Path
import numpy as np
import scipy.signal as signal
import wave

RATE=48000
DURATION=8
samples=RATE*DURATION
time=np.arange(samples,dtype=np.float64)/RATE
rng=np.random.default_rng(20261122)
def lp(a,f):
    return signal.sosfilt(signal.butter(3,f,fs=RATE,output="sos"),a)

# Непрерывный энергетический гул, сервоприводы на раскрытии/закрытии и шум трения.
opening=np.clip((time-.7)/1.2,0,1)*np.clip((4.3-time)/.8,0,1)
closing=np.clip((time-4.7)/.8,0,1)*np.clip((7.45-time)/1.5,0,1)
hum=(.12*np.sin(2*np.pi*57*time)+.05*np.sin(2*np.pi*86*time)+.02*np.sin(2*np.pi*114*time))
hum*=.40+.60*(np.sin(np.pi*time/DURATION)**2)
phase=2*np.pi*(140*time+15*time*time/DURATION)
servo=(.07*np.sin(phase)+.025*np.sin(2*phase)+.02*np.sin(3*phase))*(opening+.85*closing)
noise=lp(rng.standard_normal(samples),4200)
noise=noise/(np.std(noise)+1e-6)*.009
brushing=noise*(opening+.8*closing)
clicks=np.zeros(samples)
for center,amp in [(1.16,.05),(1.44,.043),(1.8,.045),(2.12,.045),(2.6,.035),(5.32,.038),(5.76,.045),(6.10,.045),(6.52,.04),(6.92,.05)]:
    length=int(.07*RATE)
    z=np.arange(length)/RATE
    grain=rng.standard_normal(length)
    grain=signal.sosfilt(signal.butter(2,[680,4400],btype="bandpass",fs=RATE,output="sos"),grain)
    grain/=max(1e-6,np.max(abs(grain)))
    grain*=np.exp(-z*66)*(0.48*np.sin(2*np.pi*820*z)+.52*grain)*amp
    start=int(center*RATE)
    clicks[start:start+length]+=grain[:min(length,samples-start)]
energy=(.018*np.sin(2*np.pi*(600*time+32*np.sin(2*np.pi*time/DURATION)))+.012*np.sin(2*np.pi*1200*time))
energy*=np.sin(2*np.pi*7*time)**4*(.18+.82*np.sin(np.pi*time/DURATION)**2)
fade=np.minimum(np.clip(time/.18,0,1),np.clip((DURATION-time)/.18,0,1))
mono=(hum+servo+brushing+clicks+energy)*fade
left=mono+.006*np.sin(2*np.pi*230*time)*fade*(.2+.8*opening)
right=mono+.006*np.sin(2*np.pi*229*time)*fade*(.2+.8*closing)
peak=max(np.max(abs(left)),np.max(abs(right)))
if peak>.66:
    left*=.66/peak
    right*=.66/peak
pcm=(np.stack([left,right],axis=-1)*32767).astype("<i2")
dest=Path(__file__).resolve().parent/"neiro_studiya_v4_sound.wav"
with wave.open(str(dest),"wb") as audio:
    audio.setnchannels(2)
    audio.setsampwidth(2)
    audio.setframerate(RATE)
    audio.writeframes(pcm.tobytes())
print(dest)

# Видео со звуком: ffmpeg -i silent.mp4 -i neiro_studiya_v4_sound.wav
# -c:v copy -c:a aac -b:a 192k -t 8 -movflags +faststart output.mp4
