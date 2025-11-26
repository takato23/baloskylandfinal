/**
 * Debug Panel Component
 * Provides tools for testing mobile optimizations
 * Toggle with triple-tap on mobile or F3 on desktop
 */

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store';
import { useIsMobile, useOrientation } from '../../hooks';
import { QUALITY_PRESETS, QualityLevel } from '../../utils/performance';

interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  hardwareConcurrency: number;
  deviceMemory: number | null;
  connection: string | null;
  touchPoints: number;
  isStandalone: boolean;
}

const getDeviceInfo = (): DeviceInfo => {
  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  return {
    userAgent: navigator.userAgent.slice(0, 50) + '...',
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: nav.deviceMemory || null,
    connection: conn?.effectiveType || null,
    touchPoints: navigator.maxTouchPoints,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
  };
};

export const DebugPanel: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const qualityLevel = useGameStore((s) => s.qualityLevel);
  const setQualityLevel = useGameStore((s) => s.setQualityLevel);
  const isMobile = useIsMobile();
  const orientation = useOrientation();

  // Triple tap to toggle on mobile
  useEffect(() => {
    const handleTouch = () => {
      tapCountRef.current++;

      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }

      if (tapCountRef.current >= 3) {
        setVisible((v) => !v);
        tapCountRef.current = 0;
      } else {
        tapTimeoutRef.current = setTimeout(() => {
          tapCountRef.current = 0;
        }, 500);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };

    // Listen on a specific area (top-left corner) for triple tap
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX < 100 && touch.clientY < 100) {
        handleTouch();
      }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('touchstart', handleTouchStart);
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  // Get device info when panel opens
  useEffect(() => {
    if (visible) {
      setDeviceInfo(getDeviceInfo());
    }
  }, [visible]);

  if (!visible) return null;

  const qualityOptions: QualityLevel[] = ['mobile', 'low', 'medium', 'high'];

  return (
    <div className="fixed inset-4 bg-black/95 text-white text-sm font-mono rounded-xl p-4 z-[9999] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-purple-400">🔧 Debug Panel</h2>
        <button
          onClick={() => setVisible(false)}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white font-bold"
        >
          ✕ Close
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quality Settings */}
        <div className="bg-gray-800 rounded-lg p-3">
          <h3 className="text-yellow-400 font-bold mb-2">📊 Quality Preset</h3>
          <div className="flex flex-wrap gap-2">
            {qualityOptions.map((level) => (
              <button
                key={level}
                onClick={() => setQualityLevel(level)}
                className={`px-3 py-2 rounded font-bold transition-all ${
                  qualityLevel === level
                    ? 'bg-purple-500 text-white scale-105'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Current preset details */}
          <div className="mt-3 text-xs text-gray-400">
            <div>DPR: {JSON.stringify(QUALITY_PRESETS[qualityLevel].dpr)}</div>
            <div>Shadows: {String(QUALITY_PRESETS[qualityLevel].shadows)}</div>
            <div>Bloom: {String(QUALITY_PRESETS[qualityLevel].bloom)}</div>
            <div>Camera Far: {QUALITY_PRESETS[qualityLevel].cameraFar}m</div>
            <div>Physics: {Math.round(1 / QUALITY_PRESETS[qualityLevel].physicsTimestep)}fps</div>
          </div>
        </div>

        {/* Detection Status */}
        <div className="bg-gray-800 rounded-lg p-3">
          <h3 className="text-green-400 font-bold mb-2">📱 Detection</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>isMobile:</span>
              <span className={isMobile ? 'text-green-400' : 'text-red-400'}>
                {String(isMobile)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Orientation:</span>
              <span className="text-blue-400">{orientation}</span>
            </div>
            <div className="flex justify-between">
              <span>Touch Points:</span>
              <span>{deviceInfo?.touchPoints ?? '?'}</span>
            </div>
            <div className="flex justify-between">
              <span>Standalone:</span>
              <span className={deviceInfo?.isStandalone ? 'text-green-400' : 'text-gray-400'}>
                {String(deviceInfo?.isStandalone ?? false)}
              </span>
            </div>
          </div>
        </div>

        {/* Device Info */}
        <div className="bg-gray-800 rounded-lg p-3">
          <h3 className="text-blue-400 font-bold mb-2">💻 Device Info</h3>
          {deviceInfo && (
            <div className="space-y-1 text-xs">
              <div>Screen: {deviceInfo.screenWidth}x{deviceInfo.screenHeight}</div>
              <div>DPR: {deviceInfo.devicePixelRatio}</div>
              <div>CPU Cores: {deviceInfo.hardwareConcurrency}</div>
              {deviceInfo.deviceMemory && <div>Memory: {deviceInfo.deviceMemory}GB</div>}
              {deviceInfo.connection && <div>Network: {deviceInfo.connection}</div>}
              <div className="text-gray-500 truncate">{deviceInfo.platform}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-800 rounded-lg p-3">
          <h3 className="text-orange-400 font-bold mb-2">⚡ Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded font-bold"
            >
              🔄 Reload Page
            </button>
            <button
              onClick={() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then((regs) => {
                    regs.forEach((reg) => reg.unregister());
                    alert('Service workers unregistered. Reload to re-register.');
                  });
                }
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded font-bold"
            >
              🗑️ Clear SW Cache
            </button>
            <button
              onClick={() => {
                const data = {
                  quality: qualityLevel,
                  device: deviceInfo,
                  timestamp: new Date().toISOString(),
                };
                console.log('Debug Info:', data);
                alert('Debug info logged to console');
              }}
              className="w-full bg-gray-500 hover:bg-gray-600 px-3 py-2 rounded font-bold"
            >
              📋 Log Debug Info
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-gray-500 text-xs">
        Toggle: Triple-tap top-left (mobile) or F3 (desktop)
      </div>
    </div>
  );
};
