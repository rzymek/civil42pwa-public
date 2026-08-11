import {useCallback, useEffect, useRef, useState} from "react"

interface CameraProps {
  onCapture?: (imageData: HTMLCanvasElement) => void;
  width?: number;
  height?: number;
}

export function Camera({onCapture, width = 320, height = 240}: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    try {

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: "environment", advanced: [{fillLightMode: "flash"} as any]},
        audio: false,
      })

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setCameraActive(true)
      setError(null)
    } catch (err) {
      console.error("Error accessing camera:", err)
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("nonError error")
      }
    }
  }, [])
  useEffect(() => {
    startCamera()
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setCameraActive(false)
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [stream])

  const takePicture = useCallback(() => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        const dim = getStreamDimensions(stream!);
        canvasRef.current.width = width
        canvasRef.current.height = height
        context.drawImage(videoRef.current, 0, 0, dim.width, height * dim.width / width,
          0, 0, width, height);

        if (onCapture) {
          onCapture(canvasRef.current)
          setTimeout(startCamera, 1000);
        }
      }
    }
  }, [cameraActive, height, onCapture, width])
  if(error){
    return <div>{error}</div>
  }
  return <div style={{
    position: 'relative',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'black',
    overflow: 'hidden'
  }}>
    <video
      onClick={() => {
        takePicture()
        stopCamera()
      }}
      ref={videoRef}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: cameraActive ? "block" : "none",
      }}
      autoPlay
      playsInline
    />
    <canvas ref={canvasRef} style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      display: !cameraActive ? "block" : "none"
    }}/>
  </div>
}

function getStreamDimensions(stream: MediaStream) {
  const videoTracks = stream.getVideoTracks();

  const videoTrack = videoTracks[0];
  const settings = videoTrack.getSettings();

  return {
    width: settings.width!,
    height: settings.height!,
  };
}
