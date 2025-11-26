/**
 * Gemini Live Manager
 * Headless component that manages the Gemini Live API connection
 * Handles audio input/output with seamless streaming
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// ============================================
// Configuration Constants
// ============================================

const CONFIG = {
  // Audio settings
  INPUT_SAMPLE_RATE: 16000,
  OUTPUT_SAMPLE_RATE: 24000,
  BUFFER_SIZE: 2048, // Smaller buffer for lower latency

  // Volume thresholds
  VOLUME_MULTIPLIER: 5,
  MIN_AUDIO_THRESHOLD: 0.005, // Lower threshold to capture more audio

  // Model
  MODEL_ID: 'gemini-2.0-flash-live-001',
} as const;

// ============================================
// Audio Queue for seamless playback
// ============================================

class AudioQueue {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private queue: AudioBuffer[] = [];
  private isPlaying = false;
  private nextStartTime = 0;
  private onSpeakingChange: (speaking: boolean) => void;

  constructor(ctx: AudioContext, onSpeakingChange: (speaking: boolean) => void) {
    this.ctx = ctx;
    this.gainNode = ctx.createGain();
    this.gainNode.connect(ctx.destination);
    this.onSpeakingChange = onSpeakingChange;
  }

  enqueue(buffer: AudioBuffer) {
    this.queue.push(buffer);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  private playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.onSpeakingChange(false);
      return;
    }

    this.isPlaying = true;
    this.onSpeakingChange(true);

    const buffer = this.queue.shift()!;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);

    // Schedule playback
    const now = this.ctx.currentTime;
    const startTime = Math.max(now, this.nextStartTime);
    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;

    // Schedule next buffer
    source.onended = () => {
      this.playNext();
    };
  }

  clear() {
    this.queue = [];
    this.isPlaying = false;
    this.nextStartTime = 0;
  }
}

// ============================================
// Audio Utilities
// ============================================

const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const encodeBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const floatTo16BitPCM = (float32Array: Float32Array): Int16Array => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
};

const pcm16ToFloat32 = (int16Array: Int16Array): Float32Array => {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
};

const calculateRMS = (data: Float32Array): number => {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
};

// ============================================
// Main Component
// ============================================

export const GeminiLiveManager: React.FC = () => {
  const liveSession = useGameStore((s) => s.liveSession);
  const endLiveSession = useGameStore((s) => s.endLiveSession);
  const setLiveConnectionState = useGameStore((s) => s.setLiveConnectionState);
  const setLiveVolume = useGameStore((s) => s.setLiveVolume);
  const addChatMessage = useGameStore((s) => s.addChatMessage);

  // Refs
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isCleaningUpRef = useRef(false);

  // Transcription buffers
  const inputTranscript = useRef('');
  const outputTranscript = useRef('');

  // Cleanup
  const cleanup = useCallback(() => {
    isCleaningUpRef.current = true;

    // Stop media stream
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;

    // Disconnect processor
    try {
      processorRef.current?.disconnect();
    } catch {}
    processorRef.current = null;

    // Close audio contexts
    try {
      audioContextRef.current?.close();
      outputContextRef.current?.close();
    } catch {}
    audioContextRef.current = null;
    outputContextRef.current = null;

    // Clear audio queue
    audioQueueRef.current?.clear();
    audioQueueRef.current = null;

    // Close session
    try {
      sessionRef.current?.close();
    } catch {}
    sessionRef.current = null;
  }, []);

  useEffect(() => {
    if (!liveSession.isOpen || !liveSession.npc) return;

    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[GeminiLive] Missing VITE_GEMINI_API_KEY');
      endLiveSession();
      return;
    }

    isCleaningUpRef.current = false;
    inputTranscript.current = '';
    outputTranscript.current = '';

    const ai = new GoogleGenAI({ apiKey });

    // Create output audio context and queue
    const outputCtx = new AudioContext({ sampleRate: CONFIG.OUTPUT_SAMPLE_RATE });
    outputContextRef.current = outputCtx;
    audioQueueRef.current = new AudioQueue(outputCtx, (speaking) => {
      setLiveVolume(speaking ? 0.7 : 0);
    });

    setLiveConnectionState('connecting');

    // Handle incoming messages from Gemini Live
    const handleMessage = (message: LiveServerMessage) => {
      if (isCleaningUpRef.current) return;

      // Handle audio
      const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
      if (audioData && outputContextRef.current && audioQueueRef.current) {
        const bytes = decodeBase64(audioData);
        const int16 = new Int16Array(bytes.buffer);
        const float32 = pcm16ToFloat32(int16);

        const buffer = outputContextRef.current.createBuffer(
          1,
          float32.length,
          CONFIG.OUTPUT_SAMPLE_RATE
        );
        buffer.copyToChannel(float32, 0);
        audioQueueRef.current.enqueue(buffer);
      }

      // Handle transcriptions
      if (message.serverContent?.inputTranscription?.text) {
        inputTranscript.current += message.serverContent.inputTranscription.text;
      }
      if (message.serverContent?.outputTranscription?.text) {
        outputTranscript.current += message.serverContent.outputTranscription.text;
      }

      // On turn complete, add messages to chat
      if (message.serverContent?.turnComplete) {
        if (inputTranscript.current.trim()) {
          addChatMessage('user', inputTranscript.current.trim());
          inputTranscript.current = '';
        }
        if (outputTranscript.current.trim()) {
          addChatMessage('npc', outputTranscript.current.trim());
          outputTranscript.current = '';
        }
      }
    };

    // Setup microphone after connection
    const setupMicrophone = async (session: any) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: CONFIG.INPUT_SAMPLE_RATE,
          },
        });

        if (isCleaningUpRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;

        const inputCtx = new AudioContext({ sampleRate: CONFIG.INPUT_SAMPLE_RATE });
        audioContextRef.current = inputCtx;

        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(CONFIG.BUFFER_SIZE, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isCleaningUpRef.current || !sessionRef.current) return;

          const inputData = e.inputBuffer.getChannelData(0);
          const rms = calculateRMS(inputData);

          // Visual feedback for user speaking
          setLiveVolume(Math.min(1, rms * CONFIG.VOLUME_MULTIPLIER));

          // Send audio (let Gemini's VAD handle silence detection)
          if (rms > CONFIG.MIN_AUDIO_THRESHOLD) {
            const pcm16 = floatTo16BitPCM(inputData);
            const base64 = encodeBase64(new Uint8Array(pcm16.buffer));

            try {
              sessionRef.current.sendRealtimeInput({
                media: {
                  mimeType: `audio/pcm;rate=${CONFIG.INPUT_SAMPLE_RATE}`,
                  data: base64,
                },
              });
            } catch (err) {
              // Ignore send errors during cleanup
            }
          }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);

        // Send initial greeting to trigger NPC response
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: '¡Hola!' }] }],
          turnComplete: true,
        });
      } catch (err: any) {
        console.error('[GeminiLive] Microphone error:', err.message || err);
      }
    };

    // Connect to Gemini Live using callback-based API
    const connect = async () => {
      try {
        const session = await ai.live.connect({
          model: CONFIG.MODEL_ID,
          callbacks: {
            onopen: () => {
              console.log('[GeminiLive] Connected');
              if (isCleaningUpRef.current) {
                session.close();
                return;
              }
              sessionRef.current = session;
              setLiveConnectionState('connected');
              setupMicrophone(session);
            },
            onmessage: (message: LiveServerMessage) => {
              handleMessage(message);
            },
            onerror: (e: ErrorEvent) => {
              console.error('[GeminiLive] Error:', e.message || e);
              if (!isCleaningUpRef.current) {
                setLiveConnectionState('disconnected');
              }
            },
            onclose: () => {
              console.log('[GeminiLive] Connection closed');
              if (!isCleaningUpRef.current) {
                setLiveConnectionState('disconnected');
              }
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: liveSession.npc!.voiceName },
              },
            },
            systemInstruction: liveSession.npc!.systemInstruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        });
      } catch (err: any) {
        console.error('[GeminiLive] Connection error:', err.message || err);
        if (!isCleaningUpRef.current) {
          setLiveConnectionState('disconnected');
        }
      }
    };

    connect();

    return () => {
      // Save any pending transcriptions
      if (inputTranscript.current.trim()) {
        addChatMessage('user', inputTranscript.current.trim());
      }
      if (outputTranscript.current.trim()) {
        addChatMessage('npc', outputTranscript.current.trim());
      }

      cleanup();
    };
  }, [
    liveSession.isOpen,
    liveSession.npc,
    endLiveSession,
    setLiveConnectionState,
    setLiveVolume,
    addChatMessage,
    cleanup,
  ]);

  return null;
};
