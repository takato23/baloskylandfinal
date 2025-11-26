/**
 * Integration Example: Adding SharePanel to PhotoModeUI
 *
 * This file demonstrates how to integrate the SharePanel component
 * with the existing PhotoModeUI for seamless social sharing.
 */

import { useState, useCallback, useRef } from 'react';
import { useActivityStore } from '../stores/activityStore';
import { useGameStore } from '../store';
import { PhotoModeUI } from '../components/ui-components/PhotoModeUI';
import { SharePanel } from '../components/ui-components/SharePanel';
import {
  captureScreenshot,
  type CaptureOptions,
} from '../lib/social';
import type { SavedPhoto } from '../types/photo-mode';

/**
 * Enhanced PhotoModeUI with SharePanel integration
 */
export function PhotoModeWithSharing() {
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<SavedPhoto | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const takePhoto = useActivityStore((s) => s.takePhoto);
  const savePhoto = useActivityStore((s) => s.savePhoto);
  const photoMode = useActivityStore((s) => s.photoMode);
  const isNight = useGameStore((s) => s.isNight);
  const weather = useGameStore((s) => s.weather);

  /**
   * Enhanced photo capture with screenshot
   */
  const handleCapture = useCallback(async () => {
    try {
      // Find the game canvas
      const canvas = canvasRef.current || document.querySelector<HTMLCanvasElement>('canvas');
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }

      // Determine aspect ratio based on frame
      const aspectRatio = photoMode.frame === 'instagram' ? '1:1' :
                         photoMode.frame === 'modern' ? '16:9' :
                         '9:16'; // Default to Instagram Stories

      // Capture options
      const captureOptions: CaptureOptions = {
        quality: 0.95,
        format: 'png',
        aspectRatio,
        applyFilters: true,
        includeUI: false,
      };

      // Capture the screenshot
      const screenshotDataUrl = await captureScreenshot(canvas, captureOptions);

      // Create photo metadata
      const photo = takePhoto();
      photo.fullImage = screenshotDataUrl;
      photo.thumbnail = screenshotDataUrl; // Could generate smaller thumbnail
      photo.weather = weather;
      photo.timeOfDay = isNight ? 'night' : 'day';

      // Store for SharePanel
      setCapturedPhoto(photo);
      setCapturedImageUrl(screenshotDataUrl);
      setShowSharePanel(true);

      console.log('Photo captured successfully');
    } catch (error) {
      console.error('Failed to capture photo:', error);
      alert('Failed to capture photo. Please try again.');
    }
  }, [takePhoto, photoMode.frame, weather, isNight]);

  /**
   * Handle photo save from SharePanel
   */
  const handlePhotoSave = useCallback((updatedPhoto: SavedPhoto) => {
    savePhoto(updatedPhoto);
    console.log('Photo saved with share data:', updatedPhoto);
  }, [savePhoto]);

  /**
   * Close share panel
   */
  const handleCloseSharePanel = useCallback(() => {
    setShowSharePanel(false);
    setCapturedPhoto(null);
    setCapturedImageUrl(null);
  }, []);

  return (
    <>
      {/* Photo Mode UI */}
      <PhotoModeUI
        onCapture={handleCapture}
        onShare={(platform) => {
          console.log('Quick share to:', platform);
          // Quick share without opening SharePanel
        }}
      />

      {/* Share Panel (appears after capture) */}
      {showSharePanel && capturedPhoto && capturedImageUrl && (
        <SharePanel
          photo={capturedPhoto}
          imageDataUrl={capturedImageUrl}
          onClose={handleCloseSharePanel}
          onSave={handlePhotoSave}
        />
      )}
    </>
  );
}

/**
 * Alternative: Minimal Integration
 * Just add screenshot capture to existing PhotoModeUI
 */
export function MinimalIntegration() {
  const takePhoto = useActivityStore((s) => s.takePhoto);
  const savePhoto = useActivityStore((s) => s.savePhoto);

  const handleCapture = async () => {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return;

    const screenshot = await captureScreenshot(canvas, {
      aspectRatio: '9:16',
      quality: 0.95,
    });

    const photo = takePhoto();
    photo.fullImage = screenshot;
    savePhoto(photo);
  };

  return <PhotoModeUI onCapture={handleCapture} />;
}

/**
 * Advanced: Custom Share Flow
 */
export function CustomShareFlow() {
  const [shareStep, setShareStep] = useState<'capture' | 'edit' | 'share'>('capture');
  const [photo, setPhoto] = useState<SavedPhoto | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleCapture = async () => {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return;

    const screenshot = await captureScreenshot(canvas);
    const newPhoto = useActivityStore.getState().takePhoto();
    newPhoto.fullImage = screenshot;

    setPhoto(newPhoto);
    setImageUrl(screenshot);
    setShareStep('edit');
  };

  const handleShare = async (platform: 'instagram' | 'twitter' | 'discord') => {
    if (!photo || !imageUrl) return;

    // Custom sharing logic
    setShareStep('share');
  };

  return (
    <>
      {shareStep === 'capture' && (
        <PhotoModeUI onCapture={handleCapture} />
      )}

      {shareStep === 'edit' && photo && imageUrl && (
        <SharePanel
          photo={photo}
          imageDataUrl={imageUrl}
          onClose={() => setShareStep('capture')}
          onSave={(updatedPhoto) => {
            useActivityStore.getState().savePhoto(updatedPhoto);
            setShareStep('capture');
          }}
        />
      )}
    </>
  );
}

/**
 * Usage in App.tsx or UI.tsx
 */
export function AppIntegrationExample() {
  const photoMode = useActivityStore((s) => s.photoMode);

  return (
    <div className="app">
      {/* Your existing game UI */}

      {/* Add photo mode with sharing */}
      {photoMode.isActive && <PhotoModeWithSharing />}
    </div>
  );
}

/**
 * Direct usage example with all features
 */
export function DirectUsageExample() {
  return (
    <PhotoModeWithSharing />
  );
}

export default PhotoModeWithSharing;
