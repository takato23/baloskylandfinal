/**
 * EmoteBubble Component
 * 3D animated emote bubble that appears above player heads
 * Features: bounce animation, auto-fade, queue management
 */

import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, RoundedBox } from '@react-three/drei';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';

// ============================================
// Constants
// ============================================

const BUBBLE_HEIGHT = 2.5; // Height above player
const BUBBLE_LIFETIME = 3000; // 3 seconds
const ANIMATION_DURATION = 0.3; // Bounce animation duration
const FADE_START = 2500; // When to start fading
const QUEUE_OFFSET = 0.6; // Vertical spacing for queued emotes

// ============================================
// Types
// ============================================

export interface EmoteData {
  id: string;
  emote: string;
  timestamp: number;
  queueIndex?: number;
}

interface EmoteBubbleProps {
  emote: EmoteData;
  onComplete: (id: string) => void;
}

// ============================================
// Emote Bubble Component
// ============================================

export const EmoteBubble: React.FC<EmoteBubbleProps> = ({ emote, onComplete }) => {
  const groupRef = useRef<Group>(null);
  const [scale, setScale] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const startTime = useRef(Date.now());
  const animationComplete = useRef(false);

  // Calculate vertical position based on queue index
  const yPosition = BUBBLE_HEIGHT + (emote.queueIndex || 0) * QUEUE_OFFSET;

  useFrame(() => {
    if (!groupRef.current) return;

    const elapsed = Date.now() - startTime.current;

    // Bounce in animation (elastic ease-out)
    if (elapsed < ANIMATION_DURATION * 1000 && !animationComplete.current) {
      const t = elapsed / (ANIMATION_DURATION * 1000);
      const bounceScale = 1 + Math.sin(t * Math.PI * 2) * 0.2 * (1 - t);
      const easedScale = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setScale(easedScale * bounceScale);
    } else if (!animationComplete.current) {
      animationComplete.current = true;
      setScale(1);
    }

    // Fade out animation
    if (elapsed > FADE_START) {
      const fadeProgress = (elapsed - FADE_START) / (BUBBLE_LIFETIME - FADE_START);
      setOpacity(Math.max(0, 1 - fadeProgress));
    }

    // Auto-remove after lifetime
    if (elapsed > BUBBLE_LIFETIME) {
      onComplete(emote.id);
    }

    // Gentle bobbing animation
    if (animationComplete.current) {
      const bobOffset = Math.sin(elapsed * 0.003) * 0.05;
      groupRef.current.position.y = yPosition + bobOffset;
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      onComplete(emote.id);
    };
  }, [emote.id, onComplete]);

  // Calculate bubble size based on emote
  const emojiSize = 0.8;
  const bubbleWidth = 1.2;
  const bubbleHeight = 1.2;

  return (
    <Billboard
      follow={true}
      lockX={false}
      lockY={false}
      lockZ={false}
      position={[0, yPosition, 0]}
    >
      <group ref={groupRef} scale={scale}>
        {/* Speech bubble background */}
        <RoundedBox
          args={[bubbleWidth, bubbleHeight, 0.1]}
          radius={0.2}
          smoothness={4}
          position={[0, 0, -0.05]}
        >
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={opacity * 0.95}
            side={THREE.DoubleSide}
          />
        </RoundedBox>

        {/* Bubble outline */}
        <RoundedBox
          args={[bubbleWidth * 1.05, bubbleHeight * 1.05, 0.1]}
          radius={0.2}
          smoothness={4}
          position={[0, 0, -0.06]}
        >
          <meshBasicMaterial
            color="#333333"
            transparent
            opacity={opacity * 0.3}
            side={THREE.DoubleSide}
          />
        </RoundedBox>

        {/* Speech bubble tail */}
        <group position={[0, -bubbleHeight / 2 + 0.1, 0]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <coneGeometry args={[0.15, 0.3, 3]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={opacity * 0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Emote text (emoji) */}
        <Text
          fontSize={emojiSize}
          color="#000000"
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.05]}
        >
          {emote.emote}
        </Text>

        {/* Subtle shadow effect */}
        <mesh position={[0.02, -0.02, -0.1]}>
          <planeGeometry args={[bubbleWidth, bubbleHeight]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={opacity * 0.1}
          />
        </mesh>
      </group>
    </Billboard>
  );
};

// ============================================
// Emote Bubble Queue Component
// ============================================

interface EmoteBubbleQueueProps {
  emotes: EmoteData[];
  onEmoteComplete: (id: string) => void;
}

export const EmoteBubbleQueue: React.FC<EmoteBubbleQueueProps> = ({
  emotes,
  onEmoteComplete,
}) => {
  return (
    <>
      {emotes.map((emote, index) => (
        <EmoteBubble
          key={emote.id}
          emote={{ ...emote, queueIndex: index }}
          onComplete={onEmoteComplete}
        />
      ))}
    </>
  );
};

export default EmoteBubble;
