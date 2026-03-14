import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { transcribeAudio } from '../api';

function VoiceRecorder({ onTranscript, onError }) {
  const [status, setStatus] = useState('idle'); // idle | recording | processing
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setStatus('processing');
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        try {
          const result = await transcribeAudio(blob);
          onTranscript(result.text || result.transcript || '');
        } catch (err) {
          const message =
            err.response?.data?.detail || err.message || 'Transcription failed';
          onError(message);
        } finally {
          setStatus('idle');
        }
      };

      mediaRecorder.start(250);
      setStatus('recording');
    } catch (err) {
      onError('Microphone access denied. Please allow microphone permissions.');
      setStatus('idle');
    }
  }, [onTranscript, onError]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleClick = () => {
    if (status === 'idle') {
      startRecording();
    } else if (status === 'recording') {
      stopRecording();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {status === 'recording' && (
          <>
            <div
              className="absolute inset-0 rounded-full animate-pulse-ring"
              style={{ backgroundColor: 'var(--accent-green)', opacity: 0.15 }}
            />
            <div
              className="absolute inset-0 rounded-full animate-pulse-ring"
              style={{ backgroundColor: 'var(--accent-green)', opacity: 0.08, animationDelay: '0.5s' }}
            />
          </>
        )}
        <button
          onClick={handleClick}
          disabled={status === 'processing'}
          className="relative z-10 flex items-center justify-center rounded-full transition-all duration-150 focus:outline-none"
          style={{
            width: 72,
            height: 72,
            backgroundColor:
              status === 'idle'
                ? 'var(--accent-green)'
                : status === 'recording'
                ? 'var(--accent-red)'
                : 'var(--text-muted)',
            color: '#ffffff',
            transform: status === 'recording' ? 'scale(1.08)' : 'scale(1)',
          }}
          aria-label={
            status === 'idle'
              ? 'Start recording'
              : status === 'recording'
              ? 'Stop recording'
              : 'Processing audio'
          }
        >
          {status === 'idle' && <Mic className="h-8 w-8" />}
          {status === 'recording' && <MicOff className="h-8 w-8 animate-pulse" />}
          {status === 'processing' && (
            <Loader2 className="h-8 w-8 animate-spin" />
          )}
        </button>
      </div>
      <p
        className="text-sm"
        style={{ color: 'var(--text-muted)', fontFamily: 'Source Sans 3, sans-serif', fontSize: '14px' }}
      >
        {status === 'idle' && 'Tap to speak your proposal'}
        {status === 'recording' && 'Listening... tap to stop'}
        {status === 'processing' && 'Transcribing your audio...'}
      </p>
    </div>
  );
}

export default VoiceRecorder;
