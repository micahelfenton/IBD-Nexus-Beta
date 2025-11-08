
import React, { useState, useEffect, useRef, useCallback } from 'react';
// The type for the live session object is not exported from the library.
// A local interface is defined below based on its usage.
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { SpeakingHeadIcon, StopIcon } from './icons';

interface NewEntryScreenProps {
  setAppState: () => void;
  setFinalTranscription: (transcription: string) => void;
  onCancel: () => void;
}

// The Blob type for media input is not exported by the SDK, so we define it locally.
interface MediaBlob {
  data: string;
  mimeType: string;
}

// Define a local interface for the live session object as its types are not exported.
interface LiveSession {
  sendRealtimeInput(input: { media: MediaBlob }): void;
  close(): void;
}

// Helper function to convert audio buffer to base64 PCM data
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function processAudioData(inputData: Float32Array): { pcmBlob: MediaBlob, rms: number } {
    // Calculate Root Mean Square for silence detection
    let sum = 0.0;
    for (let j = 0; j < inputData.length; j++) {
      sum += inputData[j] * inputData[j];
    }
    const rms = Math.sqrt(sum / inputData.length);
    
    // Convert Float32 audio data to 16-bit PCM
    const l = inputData.length;
    const int16 = new Int16Array(l);
    for (let j = 0; j < l; j++) {
      const sample = Math.max(-1, Math.min(1, inputData[j]));
      int16[j] = sample < 0 ? sample * 32768 : sample * 32767;
    }
    
    const pcmBlob = {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };

    return { pcmBlob, rms };
}


const NewEntryScreen: React.FC<NewEntryScreenProps> = ({ setAppState, setFinalTranscription, onCancel }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSilent, setIsSilent] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<LiveSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  
  // Refs for performance optimization: buffer transcription updates and batch them.
  const transcriptionBufferRef = useRef<string>('');
  const animationFrameRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    setIsListening(false);
    setIsSilent(false);

    // Cancel any pending animation frame to prevent state updates after cleanup
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }
    transcriptionBufferRef.current = '';

    if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
    }
    if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
    }
  }, []);

  const flushTranscriptionBuffer = useCallback(() => {
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }
    const bufferedText = transcriptionBufferRef.current;
    if (bufferedText.length > 0) {
        transcriptionBufferRef.current = '';
        setText(prev => {
            if (prev.endsWith(' ') || prev.length === 0 || bufferedText.startsWith(' ')) {
                return prev + bufferedText;
            }
            return prev + ' ' + bufferedText;
        });
    }
  }, []);

  const stopListening = useCallback(() => {
    if (isListening) {
      // First, ensure any buffered text is displayed
      flushTranscriptionBuffer();
      // Then, clean up all resources
      cleanup();
    }
  }, [isListening, cleanup, flushTranscriptionBuffer]);

  const startListening = async () => {
    if (isListening) return;
    
    // Reset state from any previous attempt
    setText('');
    setError(null);
    setIsListening(true);
    setIsSilent(false);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      // Cast to 'any' to allow for vendor-prefixed AudioContext.
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      // FIX: Explicitly resume the audio context to ensure it starts immediately.
      await audioContextRef.current.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Live session opened.');
            if (!audioContextRef.current || audioContextRef.current.state === 'closed' || !streamRef.current) {
                console.warn("AudioContext closed before live session could open. Aborting setup.");
                sessionPromise.then(session => session.close());
                return;
            }
            
            sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
            // Using the deprecated but highly reliable ScriptProcessorNode for stability.
            // Buffer size of 2048 gives ~128ms latency, a good balance of responsiveness and reliability.
            const processor = audioContextRef.current.createScriptProcessor(2048, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const { pcmBlob, rms } = processAudioData(inputData);

                // --- Silence Detection Logic ---
                const SILENCE_THRESHOLD = 0.01;
                if (rms < SILENCE_THRESHOLD) {
                    if (silenceTimerRef.current === null) {
                        silenceTimerRef.current = window.setTimeout(() => {
                            setIsSilent(true);
                        }, 3000);
                    }
                } else {
                    setIsSilent(false);
                    if (silenceTimerRef.current !== null) {
                        clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = null;
                    }
                }

                // --- Audio Sending ---
                // Use the promise to ensure the session is ready before sending data
                sessionPromise.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };
            
            // Connect the audio graph. The processor must be connected to the destination to work.
            sourceRef.current.connect(processor);
            processor.connect(audioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const newText = message.serverContent.inputTranscription.text;
              transcriptionBufferRef.current += newText;

              // Use requestAnimationFrame to batch updates and sync with browser repaint
              if (animationFrameRef.current === null) {
                animationFrameRef.current = requestAnimationFrame(() => {
                  const bufferedText = transcriptionBufferRef.current;
                  if (bufferedText.length > 0) {
                      transcriptionBufferRef.current = ''; // Clear buffer before setting state
                      setText(prev => {
                        // Combine the previous text with the buffered updates
                        if (prev.endsWith(' ') || prev.length === 0 || bufferedText.startsWith(' ')) {
                            return prev + bufferedText;
                        }
                        return prev + ' ' + bufferedText;
                      });
                  }
                  animationFrameRef.current = null;
                });
              }
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live session error:', e);
            setError('An error occurred during recording.');
            cleanup();
          },
          onclose: (e: CloseEvent) => {
            console.log('Live session closed.');
            // Cleanup is called to ensure resources are released, even if closed unexpectedly.
            cleanup();
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
      cleanup();
    }
  };
  
  const handleAnalyze = () => {
      stopListening();
      if (text.trim().length === 0) {
          setError("Please provide some input before analyzing.");
          return;
      }
      setFinalTranscription(text);
      setAppState();
  }
  
  // Ensure cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const getPromptText = () => {
    if (error) return <span className="text-red-400">{error}</span>;
    if (isListening) {
      if (isSilent) return "I can't hear you clearly. Please speak up, move to a quieter place, or type your entry.";
      return "I'm listening. Speak naturally about your day...";
    }
    return "Tap the icon to start speaking, or type your entry below.";
  };

  return (
    <div className="flex flex-col items-center justify-between h-full p-4 sm:p-8 text-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full h-10">
        <button onClick={onCancel} className="float-right text-slate-400 hover:text-white transition-colors p-2">Cancel</button>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center w-full -mt-10">
        <h1 className="text-3xl font-bold text-cyan-300 mb-2">New Entry</h1>
        <p className="text-slate-400 max-w-sm h-10">
          {getPromptText()}
        </p>
        <textarea 
            className="mt-8 p-4 bg-slate-900/50 rounded-lg min-h-[120px] w-full max-w-md text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="How are you feeling today? You can talk about your symptoms, mood, food, or anything else on your mind."
        />
      </div>

      <div className="relative flex items-center justify-center">
        {isListening && !isSilent && (
            <div className="absolute w-48 h-48 rounded-full bg-cyan-500/10 animate-ping"></div>
        )}
         {isListening && !isSilent && (
            <div className="absolute w-32 h-32 rounded-full bg-cyan-500/20 animate-pulse"></div>
        )}
        <button
          onClick={isListening ? stopListening : startListening}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out text-white shadow-lg ${isListening ? 'bg-red-500 hover:bg-red-400 shadow-red-500/30' : 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/30'}`}
          aria-label={isListening ? "Stop recording" : "Start recording"}
        >
          {isListening ? <StopIcon className="w-10 h-10" /> : <SpeakingHeadIcon className="w-12 h-12" />}
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
