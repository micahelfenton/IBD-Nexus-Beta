import React, { useState, useEffect, useRef, useCallback } from 'react';
// The type for the live session object is not exported from the library.
// A local interface is defined below based on its usage.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { ChatBubbleBottomCenterTextIcon, StopIcon } from './icons';

interface NewEntryScreenProps {
  setAppState: () => void;
  setFinalTranscription: (transcription: string) => void;
  onCancel: () => void;
}

// Helper functions for audio encoding/decoding
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Define a local interface for the live session object as it's not exported.
interface LiveSession {
  sendRealtimeInput(input: { media: Blob }): void;
  close(): void;
}

const NewEntryScreen: React.FC<NewEntryScreenProps> = ({ setAppState, setFinalTranscription, onCancel }) => {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<LiveSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const stopListening = useCallback(() => {
    if (!isListening) return;

    setIsListening(false);
    
    if(sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    
    if(streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if(processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if(sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [isListening]);


  const startListening = async () => {
    if (isListening) return;
    setError(null);
    setIsListening(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      // Cast to 'any' to allow for vendor-prefixed AudioContext.
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Live session opened.');
            // FIX: Add a guard to ensure audio context is still active when the callback fires.
            // This prevents a race condition if the user stops listening before the connection is established.
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                console.warn("AudioContext closed before live session could open. Aborting setup.");
                sessionPromise.then(session => session.close());
                return;
            }
            sourceRef.current = audioContextRef.current!.createMediaStreamSource(stream);
            processorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            sourceRef.current.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const newText = message.serverContent.inputTranscription.text;
              setText(prev => (prev.endsWith(' ') || prev.length === 0) ? prev + newText : prev + ' ' + newText);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live session error:', e);
            setError('An error occurred during recording.');
            stopListening();
          },
          onclose: (e: CloseEvent) => {
            console.log('Live session closed.');
            if (isListening) {
                setIsListening(false);
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
        },
      });

      sessionRef.current = await sessionPromise;

    } catch (error) {
      console.error('Failed to start listening:', error);
      setError('Could not access the microphone.');
      setIsListening(false);
    }
  };
  
  const handleAnalyze = () => {
      if (isListening) {
          stopListening();
      }
      if (text.trim().length === 0) {
          setError("Please provide some input before analyzing.");
          return;
      }
      setFinalTranscription(text);
      setAppState();
  }
  
  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
        if(sessionRef.current) {
            sessionRef.current.close();
        }
         if(streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-between h-full p-4 sm:p-8 text-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full h-10">
        {/* Placeholder for header area to maintain layout consistency */}
      </div>
      <div className="flex-grow flex flex-col items-center justify-center w-full -mt-10">
        <h1 className="text-3xl font-bold text-cyan-300 mb-2">New Entry</h1>
        <p className="text-slate-400 max-w-sm h-10">
          {error ? <span className="text-red-400">{error}</span> : isListening ? "I'm listening. Speak naturally about your day..." : "tap the icon below to speak or if you would rather type tap into the box"}
        </p>
        <textarea 
            className="mt-8 p-4 bg-slate-900/50 rounded-lg min-h-[120px] w-full max-w-md text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="How are you feeling today? You can talk about your symptoms, mood, food, or anything else on your mind."
        />
      </div>

      <div className="relative flex items-center justify-center">
        {isListening && (
            <div className="absolute w-48 h-48 rounded-full bg-cyan-500/10 animate-ping"></div>
        )}
         {isListening && (
            <div className="absolute w-32 h-32 rounded-full bg-cyan-500/20 animate-pulse"></div>
        )}
        <button
          onClick={isListening ? stopListening : startListening}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out text-white shadow-lg ${isListening ? 'bg-red-500 hover:bg-red-400 shadow-red-500/30' : 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/30'}`}
          aria-label={isListening ? "Stop recording" : "Start recording"}
        >
          {isListening ? <StopIcon className="w-10 h-10" /> : <ChatBubbleBottomCenterTextIcon className="w-12 h-12" />}
        </button>
      </div>

       <div className="h-16 mt-8">
            <button 
                onClick={handleAnalyze} 
                disabled={text.trim().length === 0}
                className="px-8 py-3 bg-cyan-500 rounded-lg text-lg font-semibold hover:bg-cyan-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400"
            >
                Analyze Entry
            </button>
      </div>
    </div>
  );
};

export default NewEntryScreen;