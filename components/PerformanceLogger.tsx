/**
 * Performance Logger Component
 * Displays real-time performance metrics for development and testing
 * Shows FPS, draw calls, memory, and mobile-specific metrics
 */

import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../store';

interface PerformanceStats {
  fps: number;
  avgFps: number;
  minFps: number;
  drawCalls: number;
  triangles: number;
  memory: number;
  geometries: number;
  textures: number;
  programs: number;
}

// Only show in development or when explicitly enabled
const SHOW_LOGGER = import.meta.env?.DEV ?? false;

export const PerformanceLogger: React.FC = () => {
  const { gl } = useThree();
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    avgFps: 60,
    minFps: 60,
    drawCalls: 0,
    triangles: 0,
    memory: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
  });
  const [visible, setVisible] = useState(SHOW_LOGGER);

  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const updateIntervalRef = useRef(0);

  // Track FPS over time
  useFrame(() => {
    const now = performance.now();
    const delta = now - lastTimeRef.current;
    lastTimeRef.current = now;

    // Calculate instant FPS
    const instantFps = 1000 / delta;

    // Keep last 60 frame times for averaging
    frameTimesRef.current.push(instantFps);
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    frameCountRef.current++;
    updateIntervalRef.current += delta;

    // Update stats every 500ms
    if (updateIntervalRef.current >= 500) {
      const times = frameTimesRef.current;
      const avgFps = times.reduce((a, b) => a + b, 0) / times.length;
      const minFps = Math.min(...times);

      const info = gl.info;
      const memory = (performance as any).memory;

      setStats({
        fps: Math.round(instantFps),
        avgFps: Math.round(avgFps),
        minFps: Math.round(minFps),
        drawCalls: info.render?.calls ?? 0,
        triangles: info.render?.triangles ?? 0,
        memory: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
        geometries: info.memory?.geometries ?? 0,
        textures: info.memory?.textures ?? 0,
        programs: info.programs?.length ?? 0,
      });

      updateIntervalRef.current = 0;
    }
  });

  // Toggle visibility with backtick key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const qualityLevel = useGameStore((s) => s.qualityLevel);

  if (!visible) return null;

  // Color code FPS
  const fpsColor = stats.avgFps >= 55 ? '#4CAF50' : stats.avgFps >= 30 ? '#FFC107' : '#F44336';
  const minFpsColor = stats.minFps >= 30 ? '#4CAF50' : stats.minFps >= 20 ? '#FFC107' : '#F44336';

  return (
    <group>
      {/* This is a 3D component, stats display is in HTML overlay */}
    </group>
  );
};

// Separate HTML overlay component for the UI
export const PerformanceOverlay: React.FC = () => {
  const [stats, setStats] = useState({
    fps: 60,
    avgFps: 60,
    minFps: 60,
    drawCalls: 0,
    triangles: 0,
    memory: 0,
  });
  const [visible, setVisible] = useState(false);
  const qualityLevel = useGameStore((s) => s.qualityLevel);
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let animationId: number;

    const updateStats = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      const instantFps = 1000 / delta;
      frameTimesRef.current.push(instantFps);
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      const times = frameTimesRef.current;
      if (times.length > 0) {
        setStats({
          fps: Math.round(instantFps),
          avgFps: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
          minFps: Math.round(Math.min(...times)),
          drawCalls: 0, // Would need WebGL context
          triangles: 0,
          memory: (performance as any).memory
            ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
            : 0,
        });
      }

      animationId = requestAnimationFrame(updateStats);
    };

    if (visible) {
      updateStats();
    }

    return () => cancelAnimationFrame(animationId);
  }, [visible]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (!visible) return null;

  const fpsColor = stats.avgFps >= 55 ? '#4CAF50' : stats.avgFps >= 30 ? '#FFC107' : '#F44336';

  return (
    <div
      className="fixed top-0 right-0 bg-black/85 text-xs font-mono p-2 m-2 rounded-lg shadow-lg z-[9999] select-none"
      style={{ minWidth: '140px' }}
    >
      <div className="text-gray-400 text-[10px] mb-1">Performance [~]</div>
      <div className="flex justify-between">
        <span className="text-gray-400">FPS:</span>
        <span style={{ color: fpsColor }}>{stats.fps}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Avg:</span>
        <span style={{ color: fpsColor }}>{stats.avgFps}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Min:</span>
        <span style={{ color: stats.minFps >= 30 ? '#4CAF50' : '#F44336' }}>{stats.minFps}</span>
      </div>
      {stats.memory > 0 && (
        <div className="flex justify-between">
          <span className="text-gray-400">Mem:</span>
          <span className="text-blue-400">{stats.memory}MB</span>
        </div>
      )}
      <div className="flex justify-between mt-1 pt-1 border-t border-gray-700">
        <span className="text-gray-400">Quality:</span>
        <span className="text-purple-400">{qualityLevel}</span>
      </div>
    </div>
  );
};
