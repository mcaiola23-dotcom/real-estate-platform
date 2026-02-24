'use client';

import { useCallback, useRef, useState } from 'react';

interface VoiceNoteRecorderProps {
  onRecordingComplete: (audioBlob: Blob, durationSeconds: number) => void;
}

type RecordingState = 'idle' | 'recording' | 'recorded';

export function VoiceNoteRecorder({ onRecordingComplete }: VoiceNoteRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const audioBlobRef = useRef<Blob | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        audioBlobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setState('recorded');

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250);
      startTimeRef.current = Date.now();
      setState('recording');

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 250);
    } catch {
      // Microphone access denied or unavailable
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
  }, []);

  const discard = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    audioBlobRef.current = null;
    setDuration(0);
    setState('idle');
  }, [audioUrl]);

  const save = useCallback(() => {
    if (audioBlobRef.current) {
      onRecordingComplete(audioBlobRef.current, duration);
      discard();
    }
  }, [duration, onRecordingComplete, discard]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="crm-voice-recorder">
      {state === 'idle' && (
        <button type="button" className="crm-voice-recorder-start" onClick={startRecording}>
          <span className="crm-voice-recorder-mic">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="5.5" y="2" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3.5 8.5a4.5 4.5 0 009 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 13v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          Record Voice Note
        </button>
      )}

      {state === 'recording' && (
        <div className="crm-voice-recorder-active">
          <span className="crm-voice-recorder-pulse" />
          <span className="crm-voice-recorder-timer">{formatDuration(duration)}</span>
          <button type="button" className="crm-voice-recorder-stop" onClick={stopRecording}>
            Stop
          </button>
        </div>
      )}

      {state === 'recorded' && audioUrl && (
        <div className="crm-voice-recorder-preview">
          <audio src={audioUrl} controls className="crm-voice-recorder-audio" />
          <span className="crm-muted">{formatDuration(duration)}</span>
          <div className="crm-voice-recorder-preview-actions">
            <button type="button" className="crm-secondary-button" onClick={discard}>
              Discard
            </button>
            <button type="button" className="crm-primary-button" onClick={save}>
              Save Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
