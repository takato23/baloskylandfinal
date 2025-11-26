/**
 * Interactive Billboard Component
 * A large screen on a building where users can upload images or video URLs
 * All players see the same content (synced via Supabase realtime broadcast)
 */

import React, { useState, useRef, useEffect } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Box, Plane, Html } from '@react-three/drei';
import { useGameStore, Controls } from '../../store';
import { useKeyboardControls } from '@react-three/drei';
import { playSound } from '../../utils/audio';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import * as THREE from 'three';

interface BillboardProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number]; // width, height
}

// Default placeholder if no content is set
const DEFAULT_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <rect fill="#1a1a2e" width="800" height="450"/>
  <text x="400" y="200" text-anchor="middle" fill="#4a90e2" font-family="Arial" font-size="48" font-weight="bold">
    VILLA LIBERTAD
  </text>
  <text x="400" y="260" text-anchor="middle" fill="#666" font-family="Arial" font-size="24">
    Toca E para subir contenido
  </text>
  <circle cx="400" cy="340" r="30" fill="none" stroke="#4a90e2" stroke-width="3"/>
  <path d="M385 340 L400 325 L415 340" fill="none" stroke="#4a90e2" stroke-width="3"/>
  <path d="M400 325 L400 355" fill="none" stroke="#4a90e2" stroke-width="3"/>
</svg>
`);

export const InteractiveBillboard: React.FC<BillboardProps> = ({
  position,
  rotation = [0, 0, 0],
  size = [8, 4.5], // 16:9 aspect ratio by default
}) => {
  const [inRange, setInRange] = useState(false);
  const [showUploadUI, setShowUploadUI] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const setInteractionLabel = useGameStore(s => s.setInteractionLabel);
  const isHolding = useGameStore(s => s.isHolding);
  const [subscribeKeys] = useKeyboardControls();
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenMeshRef = useRef<THREE.Mesh>(null);

  // Fetch current billboard content and subscribe to updates
  useEffect(() => {
    // Try to load from localStorage first (works offline)
    const savedMedia = localStorage.getItem('billboard_media');
    if (savedMedia) {
      try {
        const parsed = JSON.parse(savedMedia);
        setCurrentMedia(parsed);
      } catch (e) {
        // Invalid saved data
      }
    }

    // If Supabase is configured, use realtime broadcast for sync
    if (!isSupabaseConfigured()) {
      console.log('Billboard: Running in local-only mode');
      return;
    }

    // Subscribe to realtime broadcast channel
    const channel = supabase
      .channel('billboard_sync')
      .on('broadcast', { event: 'media_update' }, ({ payload }) => {
        if (payload && payload.url) {
          const media = {
            url: payload.url as string,
            type: payload.type as 'image' | 'video'
          };
          setCurrentMedia(media);
          // Also save locally for persistence
          localStorage.setItem('billboard_media', JSON.stringify(media));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle keyboard interaction
  useEffect(() => {
    if (inRange && !isHolding) {
      const sub = subscribeKeys(
        (state) => state[Controls.interact],
        (pressed) => {
          if (pressed && !showUploadUI) {
            setShowUploadUI(true);
            playSound('gem');
          }
        },
        { fireImmediately: false }
      );
      return () => sub();
    }
  }, [inRange, isHolding, showUploadUI]);

  // Handle media upload
  const handleUpload = async () => {
    if (!inputUrl.trim()) return;

    setIsLoading(true);

    const isVideo = inputUrl.includes('youtube') ||
                    inputUrl.includes('youtu.be') ||
                    inputUrl.includes('.mp4') ||
                    inputUrl.includes('vimeo');

    const mediaType = isVideo ? 'video' : 'image';
    let finalUrl = inputUrl;

    // Convert YouTube URLs to embed format
    if (inputUrl.includes('youtube.com/watch')) {
      const videoId = inputUrl.split('v=')[1]?.split('&')[0];
      if (videoId) {
        finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
      }
    } else if (inputUrl.includes('youtu.be/')) {
      const videoId = inputUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
      }
    }

    try {
      const media = { url: finalUrl, type: mediaType };

      // Save locally first (always works)
      localStorage.setItem('billboard_media', JSON.stringify(media));
      setCurrentMedia(media);

      // If Supabase is configured, broadcast to all players
      if (isSupabaseConfigured()) {
        const channel = supabase.channel('billboard_sync');
        await channel.send({
          type: 'broadcast',
          event: 'media_update',
          payload: media
        });
      }

      playSound('coin');
      setShowUploadUI(false);
      setInputUrl('');
    } catch (err) {
      console.error('Failed to upload billboard content:', err);
      // Still update locally even if broadcast fails
      const media = { url: finalUrl, type: mediaType };
      localStorage.setItem('billboard_media', JSON.stringify(media));
      setCurrentMedia(media);
      setShowUploadUI(false);
      setInputUrl('');
    }

    setIsLoading(false);
  };

  const closeUploadUI = () => {
    setShowUploadUI(false);
    setInputUrl('');
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Billboard Frame */}
      <RigidBody type="fixed" colliders="cuboid">
        {/* Frame border */}
        <Box args={[size[0] + 0.4, size[1] + 0.4, 0.3]} position={[0, size[1] / 2 + 2, 0]}>
          <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
        </Box>

        {/* Screen surface */}
        <Plane
          ref={screenMeshRef}
          args={[size[0], size[1]]}
          position={[0, size[1] / 2 + 2, 0.16]}
        >
          {currentMedia?.type === 'image' || !currentMedia ? (
            <meshBasicMaterial>
              <primitive
                attach="map"
                object={new THREE.TextureLoader().load(currentMedia?.url || DEFAULT_IMAGE)}
              />
            </meshBasicMaterial>
          ) : (
            <meshBasicMaterial color="#000" />
          )}
        </Plane>

        {/* Video/YouTube embed using Html */}
        {currentMedia?.type === 'video' && (
          <Html
            position={[0, size[1] / 2 + 2, 0.17]}
            transform
            scale={0.5}
            style={{
              width: `${size[0] * 100}px`,
              height: `${size[1] * 100}px`,
              pointerEvents: 'none',
            }}
          >
            {currentMedia.url.includes('youtube') ? (
              <iframe
                src={currentMedia.url}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{ pointerEvents: 'none' }}
              />
            ) : (
              <video
                ref={videoRef}
                src={currentMedia.url}
                autoPlay
                loop
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </Html>
        )}

        {/* Support poles */}
        <Box args={[0.3, 4, 0.3]} position={[-size[0] / 2 - 0.1, 2, 0]}>
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </Box>
        <Box args={[0.3, 4, 0.3]} position={[size[0] / 2 + 0.1, 2, 0]}>
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </Box>

        {/* Decorative lights around frame */}
        <pointLight color="#4a90e2" intensity={0.5} distance={10} position={[0, size[1] + 2.5, 0.5]} />
      </RigidBody>

      {/* Interaction sensor */}
      <RigidBody type="fixed" colliders={false} sensor>
        <CuboidCollider
          args={[size[0] / 2 + 2, 3, 4]}
          position={[0, 2, 2]}
          onIntersectionEnter={({ other }) => {
            if (other.rigidBodyObject?.name === 'player') {
              setInRange(true);
              if (!isHolding) setInteractionLabel('Pantalla');
            }
          }}
          onIntersectionExit={({ other }) => {
            if (other.rigidBodyObject?.name === 'player') {
              setInRange(false);
              setInteractionLabel(null);
              setShowUploadUI(false);
            }
          }}
        />
      </RigidBody>

      {/* Upload UI Modal */}
      {showUploadUI && (
        <Html position={[0, size[1] / 2 + 4, 2]} center>
          <div
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              borderRadius: '16px',
              padding: '24px',
              minWidth: '320px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              border: '2px solid #4a90e2',
              color: 'white',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', textAlign: 'center' }}>
              📺 Subir a la Pantalla
            </h3>

            <input
              type="text"
              placeholder="URL de imagen o video de YouTube"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #4a90e2',
                background: '#0d1321',
                color: 'white',
                fontSize: '14px',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleUpload()}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleUpload}
                disabled={isLoading || !inputUrl.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isLoading ? '#666' : 'linear-gradient(135deg, #4a90e2 0%, #667eea 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer',
                  fontSize: '14px',
                }}
              >
                {isLoading ? 'Subiendo...' : 'Subir'}
              </button>

              <button
                onClick={closeUploadUI}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: '1px solid #666',
                  background: 'transparent',
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cerrar
              </button>
            </div>

            <p style={{
              fontSize: '11px',
              color: '#666',
              marginTop: '12px',
              textAlign: 'center'
            }}>
              Soporta: Imágenes (JPG, PNG, GIF) y YouTube
            </p>
          </div>
        </Html>
      )}
    </group>
  );
};

export default InteractiveBillboard;
