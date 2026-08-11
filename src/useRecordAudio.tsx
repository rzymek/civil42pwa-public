import {useCallback, useRef} from 'react';

export function useRecordAudio() {
  const callback = useRef((_:Blob)=>{});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {type: 'audio/webm'});
        stream.getTracks().forEach(track => track.stop());
        callback.current(blob);
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, []);

  const stop = (fn: (audio: Blob) => void) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      callback.current = fn;
      mediaRecorderRef.current.stop();
    }
  };

  return {
    start,
    stop,
  };
}
