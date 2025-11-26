# 3D Emote Bubble System

A complete real-time emote system for Cozy City Explorer multiplayer game, featuring 3D animated bubbles, radial emote wheel selector, and seamless multiplayer integration.

## Features

- **3D Animated Bubbles**: Speech-bubble style emotes that appear above player heads
- **Bounce Animation**: Elastic ease-out animation when emotes appear
- **Auto-fade**: Emotes automatically disappear after 3 seconds
- **Queue System**: Multiple emotes stack vertically and animate in sequence
- **Radial Emote Wheel**: Hold Q (or long-press on mobile) to open 8-segment emote selector
- **Real-time Multiplayer**: Emotes broadcast to all nearby players via Supabase
- **Mobile Support**: Touch-friendly emote wheel with long-press activation
- **Performance Optimized**: Efficient rendering for 100+ concurrent users

## Components

### EmoteBubble.tsx
3D billboard component that renders a speech bubble with emoji above player heads.

**Features:**
- Smooth bounce-in animation using elastic easing
- Gentle bobbing motion
- Fade-out after 2.5 seconds
- Automatic cleanup after 3 seconds
- Queue support for multiple emotes

**Props:**
```typescript
interface EmoteBubbleProps {
  emote: EmoteData;      // Emote data (id, emoji, action, timestamp)
  onComplete: (id: string) => void;  // Callback when emote expires
}
```

### EmoteBubbleQueue.tsx
Container component that manages multiple emote bubbles with vertical stacking.

**Props:**
```typescript
interface EmoteBubbleQueueProps {
  emotes: EmoteData[];   // Array of active emotes
  onEmoteComplete: (id: string) => void;  // Cleanup callback
}
```

### EmoteWheel.tsx
Radial UI selector with 8 emote options arranged in a circle.

**Activation:**
- **Desktop**: Hold Q key, move mouse to select, release Q to send
- **Mobile**: Long-press screen (300ms), move finger to select, release to send

**Emote Options:**
1. 👋 Wave - Triggers wave animation
2. ❤️ Love - Show love/appreciation
3. 😂 Laugh - Express humor
4. 🎉 Celebrate - Party time
5. 👍 Thumbs Up - Show approval
6. 🔥 Fire - Something's hot
7. ⭐ Star - Mark something special
8. 🎮 Gaming - Gaming vibes

**Props:**
```typescript
interface EmoteWheelProps {
  onEmote: (emoji: string, action: string) => void;
  isMobile?: boolean;
}
```

### EmoteSystem.tsx
High-level integration component that connects EmoteWheel to multiplayer system.

**Features:**
- Handles emote broadcasting via Supabase
- Only renders when connected to multiplayer
- Mobile detection
- Special action handling (chat, photo)

### LocalPlayerEmotes.tsx
Renders emote bubbles above the local player's character.

**Usage:**
```tsx
// In Player.tsx or character component
<group ref={groupRef} position={playerPosition}>
  <CharacterModel />
  <LocalPlayerEmotes />
</group>
```

## Integration

### 1. Add to UI Component
```tsx
// In components/UI.tsx or App.tsx
import { EmoteSystem } from './components/multiplayer';

export const UI = () => {
  return (
    <>
      {/* Other UI elements */}
      <EmoteSystem />
    </>
  );
};
```

### 2. Add to Player Component
```tsx
// In components/Player.tsx
import { LocalPlayerEmotes } from './multiplayer';

export const Player = () => {
  return (
    <group>
      <CharacterModel />
      <LocalPlayerEmotes />
    </group>
  );
};
```

### 3. RemotePlayers Already Integrated
The `RemotePlayers.tsx` component already renders emote bubbles for other players automatically.

## Usage

### Sending Emotes
```typescript
import { useMultiplayer } from './hooks/useMultiplayer';

const { doEmote, isConnected } = useMultiplayer();

// Send an emote
if (isConnected) {
  doEmote('👋', 'wave');
}
```

### Accessing Local Emotes
```typescript
const { localEmotes, removeEmote } = useMultiplayer();

// Remove an emote when it expires
removeEmote(emoteId, true); // true = local emote
```

### Accessing Remote Player Emotes
```typescript
const players = useRemotePlayers();

players.forEach(player => {
  console.log(`${player.username} has ${player.emotes.length} active emotes`);
});
```

## Data Flow

1. **User Input**: Player holds Q key or long-presses screen
2. **Emote Selection**: EmoteWheel displays, user selects emote
3. **Local Display**: EmoteBubble appears above local player immediately
4. **Broadcast**: Emote sent to Supabase realtime channel
5. **Remote Receive**: Other players receive emote via subscription
6. **Remote Display**: EmoteBubble appears above remote player
7. **Auto-cleanup**: Emotes fade and remove after 3 seconds

## Architecture

```
EmoteSystem (UI)
    ↓
EmoteWheel (Input)
    ↓
useMultiplayer.doEmote()
    ↓
    ├── Local: multiplayerState.localEmotes
    │   └→ LocalPlayerEmotes → EmoteBubbleQueue
    └── Broadcast: lib/supabase.sendEmote()
        ↓
        Supabase Realtime
        ↓
        useMultiplayer (onEmote callback)
        ↓
        multiplayerState.playerEmotes
        ↓
        RemotePlayers → EmoteBubbleQueue
```

## Types

### EmoteData
```typescript
interface EmoteData {
  id: string;           // Unique identifier
  emoji: string;        // Unicode emoji
  action: EmoteType;    // Action name ('wave', 'love', etc.)
  timestamp: number;    // Creation time
  queueIndex?: number;  // Position in queue (for stacking)
}
```

### EmotePayload (Network)
```typescript
interface EmotePayload {
  id: string;
  userId: string;
  username: string;
  emote: string;
  action: string;
  position: [number, number, number];
  timestamp: number;
}
```

## Configuration

### Timing Constants
```typescript
// In EmoteBubble.tsx
const BUBBLE_LIFETIME = 3000;    // Total display time (ms)
const ANIMATION_DURATION = 0.3;  // Bounce animation (seconds)
const FADE_START = 2500;         // When to start fading (ms)
const QUEUE_OFFSET = 0.6;        // Vertical spacing for queue

// In EmoteWheel.tsx
const HOLD_DURATION = 300;       // Time to activate wheel (ms)
const WHEEL_RADIUS = 120;        // Wheel size (px)
const CENTER_DEADZONE = 30;      // Cancel zone (px)
```

### Visual Constants
```typescript
// In EmoteBubble.tsx
const BUBBLE_HEIGHT = 2.5;       // Height above player head
const BUBBLE_WIDTH = 1.2;        // Three.js units
const EMOJI_SIZE = 0.8;          // Font size
```

## Performance

- **Bubble Count**: Unlimited per player (auto-cleanup after 3s)
- **Update Rate**: 60 FPS smooth animations via useFrame
- **Network**: Minimal payload (~200 bytes per emote)
- **Render Distance**: Inherits from RemotePlayers (100 units default)

## Browser Compatibility

- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS 14+, Android Chrome 90+
- **WebGL**: Required for 3D rendering
- **WebSocket**: Required for real-time sync

## Troubleshooting

### Emotes Not Appearing
1. Check multiplayer connection: `isConnected === true`
2. Verify Supabase configuration in `.env.local`
3. Check browser console for errors

### Emote Wheel Not Opening
1. Ensure Q key is held for 300ms
2. On mobile, verify long-press duration
3. Check that multiplayer is connected

### Performance Issues
1. Limit emote frequency (add cooldown)
2. Reduce BUBBLE_LIFETIME constant
3. Lower MAX_VISIBLE_PLAYERS in useMultiplayer.ts

## Future Enhancements

- [ ] Custom emote packs
- [ ] Emote sound effects
- [ ] Animation triggers (wave emote = wave animation)
- [ ] Emote reactions (click bubble to react)
- [ ] Emote history/favorites
- [ ] Cooldown system
- [ ] Proximity-based emote visibility
- [ ] Emote achievements

## Credits

Built for Cozy City Explorer using:
- React Three Fiber (3D rendering)
- @react-three/drei (3D helpers)
- Supabase (real-time backend)
- Zustand (state management)
