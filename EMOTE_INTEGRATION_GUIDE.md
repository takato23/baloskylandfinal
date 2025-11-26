# Emote System Integration Guide

Quick guide to integrate the 3D emote bubble system into Cozy City Explorer.

## Quick Start

The emote system is now fully implemented and ready to use! Follow these steps to integrate it into your game.

## Step 1: Add EmoteSystem to UI

Add the `EmoteSystem` component to your main UI component to enable the emote wheel:

```tsx
// In components/UI.tsx
import { EmoteSystem } from './multiplayer';

export const UI = () => {
  return (
    <>
      {/* Existing UI components */}
      <ChatWindow />
      <MobileControls />
      {/* ... */}

      {/* Add EmoteSystem at the end */}
      <EmoteSystem />
    </>
  );
};
```

## Step 2: Add LocalPlayerEmotes to Player

Add the `LocalPlayerEmotes` component to your Player component to show emotes above your character:

```tsx
// In components/Player.tsx
import { LocalPlayerEmotes } from './multiplayer';

export const Player = () => {
  return (
    <group ref={groupRef}>
      {/* Character model */}
      <CharacterModel {...characterProps} />

      {/* Add local player emotes */}
      <LocalPlayerEmotes />
    </group>
  );
};
```

## Step 3: That's It!

The `RemotePlayers.tsx` component already renders emote bubbles for other players automatically. No additional changes needed!

## Usage

### Desktop
1. Hold the **Q** key to open the emote wheel
2. Move your mouse to select an emote
3. Release **Q** to send the emote

### Mobile
1. **Long-press** anywhere on the screen (300ms)
2. Move your finger to select an emote
3. Release to send the emote

## Available Emotes

| Emoji | Name | Action | Description |
|-------|------|--------|-------------|
| 👋 | Wave | `wave` | Triggers wave animation |
| ❤️ | Love | `love` | Show appreciation |
| 😂 | Laugh | `laugh` | Express humor |
| 🎉 | Celebrate | `celebrate` | Party time |
| 👍 | Thumbs Up | `thumbsup` | Show approval |
| 🔥 | Fire | `fire` | Something's hot |
| ⭐ | Star | `star` | Mark something special |
| 🎮 | Gaming | `gaming` | Gaming vibes |

## How It Works

1. **User Input**: Hold Q (desktop) or long-press (mobile)
2. **Emote Wheel**: Radial selector appears with 8 emote options
3. **Selection**: Mouse/finger position determines selected emote
4. **Broadcast**: Emote sent to Supabase realtime channel
5. **Display**: 3D bubble appears above player's head
6. **Visibility**: All nearby players see the emote
7. **Auto-fade**: Emote disappears after 3 seconds

## Features

### 3D Animated Bubbles
- Speech-bubble style with smooth animations
- Elastic bounce-in effect
- Gentle bobbing motion
- Auto-fade after 3 seconds

### Queue System
- Multiple emotes stack vertically
- Up to 3 emotes visible at once
- Automatic spacing and positioning

### Multiplayer Integration
- Real-time broadcasting via Supabase
- Visible to all players in the game
- Synchronized across all clients

### Mobile Optimized
- Touch-friendly emote wheel
- Long-press activation
- Responsive UI elements

## Configuration

### Timing (in EmoteBubble.tsx)
```typescript
const BUBBLE_LIFETIME = 3000;    // 3 seconds total
const FADE_START = 2500;         // Start fading at 2.5s
const ANIMATION_DURATION = 0.3;  // 300ms bounce animation
```

### Emote Wheel (in EmoteWheel.tsx)
```typescript
const HOLD_DURATION = 300;   // 300ms to activate
const WHEEL_RADIUS = 120;    // Wheel size in pixels
```

### Adding Custom Emotes

To add more emotes, edit `EMOTE_CONFIGS` in `EmoteWheel.tsx`:

```typescript
const EMOTE_CONFIGS = [
  { emoji: '👋', label: 'Wave', action: 'wave' },
  { emoji: '❤️', label: 'Love', action: 'love' },
  // Add your custom emotes here
  { emoji: '🎵', label: 'Music', action: 'music' },
] as const;
```

Then add the action type to `types/game.ts`:

```typescript
export const EMOTE_TYPES = [
  'wave', 'love', 'laugh', 'celebrate', 'thumbsup',
  'fire', 'star', 'gaming', 'chat', 'photo',
  'music', // Add new type
] as const;
```

## Testing

### Local Testing
1. Start the dev server: `npm run dev`
2. Open two browser windows
3. Connect both to multiplayer
4. Send an emote from one window
5. Verify it appears in both windows

### Multiplayer Testing
1. Deploy to production or use ngrok
2. Connect from multiple devices
3. Test emote broadcasting
4. Verify mobile touch controls work

## Troubleshooting

### Emote Wheel Not Opening
- **Desktop**: Make sure you're holding Q, not just tapping
- **Mobile**: Verify long-press duration (300ms)
- Check console for errors

### Emotes Not Broadcasting
- Verify multiplayer is connected: Check `isConnected === true`
- Check Supabase configuration in `.env.local`
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

### Emotes Not Appearing
- Check that `LocalPlayerEmotes` is added to Player component
- Verify `EmoteSystem` is added to UI component
- Look for errors in browser console

### Performance Issues
- Reduce `MAX_VISIBLE_PLAYERS` in `useMultiplayer.ts`
- Lower `BUBBLE_LIFETIME` to reduce active emotes
- Disable emotes for distant players

## API Reference

### useMultiplayer Hook
```typescript
const {
  doEmote,        // Send an emote
  localEmotes,    // Active local emotes
  removeEmote,    // Remove an emote
  isConnected,    // Connection status
} = useMultiplayer();
```

### Sending Emotes Programmatically
```typescript
// Send an emote from code
if (isConnected) {
  doEmote('🎉', 'celebrate');
}
```

### Accessing Remote Player Emotes
```typescript
const players = useRemotePlayers();

players.forEach(player => {
  console.log(player.emotes); // Array of EmoteData
});
```

## Files Created

- `components/multiplayer/EmoteBubble.tsx` - 3D bubble component
- `components/multiplayer/EmoteBubbleQueue.tsx` - Queue management (exported from EmoteBubble.tsx)
- `components/multiplayer/EmoteWheel.tsx` - Radial selector UI
- `components/multiplayer/EmoteSystem.tsx` - Integration component
- `components/multiplayer/LocalPlayerEmotes.tsx` - Local player emotes
- `types/game.ts` - Updated with emote types
- `hooks/useMultiplayer.ts` - Updated with emote tracking
- `lib/supabase.ts` - Updated with emote broadcasting

## Files Modified

- `components/multiplayer/RemotePlayers.tsx` - Added emote rendering
- `components/multiplayer/index.ts` - Added exports

## Next Steps

1. Add the components to your UI and Player as shown above
2. Test locally with multiple browser windows
3. Customize emote options to match your game's theme
4. Add sound effects for emotes (optional)
5. Implement special actions (wave animation, screenshot, etc.)

## Support

For more details, see:
- `components/multiplayer/EMOTE_SYSTEM_README.md` - Complete documentation
- `types/game.ts` - Type definitions
- `hooks/useMultiplayer.ts` - Multiplayer hook implementation

Happy emoting! 🎉
