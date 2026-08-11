import './app.css'
import {Camera} from "./Camera.tsx";
import {useRecordAudio} from "./useRecordAudio.tsx";
import {useEffect, useState} from "react";
import {useGeoLocation} from 'use-geo-location';
import {send} from "./send.tsx";
import version from "./version.txt?raw";

const welcome = `[Nagrywam] Nacinij, aby wysłać zdjęcie z audio i pozycją [${version}]`

export function App() {
  const audio = useRecordAudio()
  const [label, setLabel] = useState('Ładuje lokalizacje...')
  useEffect(() => {
    audio.start();
    return () => audio.stop(() => {
    })
  }, []);
  const gps = useGeoLocation()
  useEffect(() => {
    if (!gps.loading) {
      if (gps.error) {
        if (gps.error instanceof Error) {
          setLabel(gps.error.message);
        }else{
          setLabel(`GPS err: ${gps.error}`)
        }
      } else {
        setLabel(welcome)
      }
    }
  }, [gps.loading, gps.error]);

  function submit(photo: HTMLCanvasElement, voice: Blob) {
    setLabel('Wysyłam...')
    photo.toBlob(image => {
      const data: { voice: Blob; image: Blob | null, gps: { lat: number; lon: number } } = {
        voice,
        image,
        gps: {
          lat: gps.latitude,
          lon: gps.longitude,
        }
      };
      send(data).then(txt => setLabel(txt))
    })
    audio.start();
  }

  return <div style={{display: 'grid', gridTemplateRows: '1fr', width: '100vw', height: '100vh'}}>
    <Camera onCapture={(photo) =>
      audio.stop((voice) =>
        submit(photo, voice)
      )}/>
    <div style={{
      position: 'absolute',
      bottom: '1cm',
      left: '50%',
      transform: 'translate(-50%, 0)',
      pointerEvents: 'none',
      background: 'white',
      opacity: 0.5,
      padding: 8,
      borderRadius: 10
    }}>
      {label}
    </div>
  </div>
}