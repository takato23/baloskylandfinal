# Events System - Quick Start Guide

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Manual Event Triggering](#manual-event-triggering)
- [Creating Custom Events](#creating-custom-events)
- [Customization](#customization)

## Overview

The Events System adds engaging community events to Cozy City Explorer:
- **Treasure Hunt**: Collect golden chests around the city (5 min)
- **Skate Race**: Race through checkpoints on skateboard (5 min)

Events auto-schedule every 30 minutes and support 100+ concurrent players with real-time synchronization.

## Installation

The events system is already integrated! No additional installation needed.

**Files Created:**
```
lib/events.ts                        # Supabase integration
hooks/useEvents.ts                   # React hook for events
components/events/
  ├── TreasureHunt.tsx              # Treasure hunt component
  ├── SkateRace.tsx                 # Skate race component
  ├── EventManager.tsx              # Event orchestrator
  └── index.ts                      # Exports
components/ui-components/
  └── EventBanner.tsx               # Event UI overlay
```

**Integrations:**
- ✅ App.tsx - EventManager added to Physics world
- ✅ UI.tsx - EventBanner added to UI layer
- ✅ hooks/index.ts - useEvents exported
- ✅ components/ui-components/index.ts - EventBanner exported

## Basic Usage

### For Players

**Join an Event:**
1. Wait for event banner to appear (auto-scheduled every 30 min)
2. Click **"¡PARTICIPAR!"** button
3. Complete objectives:
   - **Treasure Hunt**: Walk near golden chests to collect (10 coins each)
   - **Skate Race**: Pass through all checkpoints on skateboard
4. View final leaderboard when timer ends

### For Developers

**Access Event State:**
```typescript
import { useEvents } from '../hooks';

function MyComponent() {
  const {
    currentEvent,      // Current event or null
    isParticipating,   // Whether player joined
    leaderboard,       // Event results
    playerProgress,    // Player's score/progress
    joinEvent,         // Function to join
    updateProgress,    // Update score
  } = useEvents();

  // Check if event active
  if (currentEvent?.status === 'active') {
    console.log(`Event: ${currentEvent.type}`);
    console.log(`Time left: ${currentEvent.endTime - Date.now()}ms`);
  }

  // Join event programmatically
  const handleJoin = () => {
    if (currentEvent) {
      joinEvent(currentEvent.id);
    }
  };

  return (
    <div>
      {currentEvent && (
        <button onClick={handleJoin}>Join Event</button>
      )}
    </div>
  );
}
```

## Manual Event Triggering

**Console Commands:**
```javascript
// Start treasure hunt immediately
window.triggerEvent('treasure_hunt');

// Start skate race immediately
window.triggerEvent('skate_race');

// Start random event
window.triggerEvent();
```

**From Component:**
```typescript
// Events auto-start every 30 minutes
// To change interval, edit EventManager.tsx:
const EVENT_INTERVAL = 15 * 60 * 1000; // 15 minutes instead
```

## Creating Custom Events

### 1. Create Event Component

```typescript
// components/events/MyCustomEvent.tsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store';
import { playSound } from '../../utils/audio';
import type { EventState } from '../../lib/events';

interface MyCustomEventProps {
  event: EventState;
  onComplete: (score: number) => void;
}

export const MyCustomEvent: React.FC<MyCustomEventProps> = ({
  event,
  onComplete,
}) => {
  const [score, setScore] = useState(0);
  const playerPosition = useGameStore((s) => s.playerPosition);

  // Event logic here
  useEffect(() => {
    // Check completion condition
    const timeRemaining = event.endTime - Date.now();
    if (timeRemaining <= 0) {
      onComplete(score);
    }
  }, [event, score, onComplete]);

  return (
    <group>
      {/* Your 3D event elements here */}
    </group>
  );
};
```

### 2. Register Event Type

```typescript
// lib/events.ts
export type EventType =
  | 'treasure_hunt'
  | 'skate_race'
  | 'my_custom_event'; // Add here
```

### 3. Add to EventManager

```typescript
// components/events/EventManager.tsx
import { MyCustomEvent } from './MyCustomEvent';

const EVENT_TYPES: EventType[] = [
  'treasure_hunt',
  'skate_race',
  'my_custom_event', // Add here
];

// In render:
{currentEvent.type === 'my_custom_event' && (
  <MyCustomEvent event={currentEvent} onComplete={handleEventComplete} />
)}
```

### 4. Update EventBanner

```typescript
// components/ui-components/EventBanner.tsx
const getEventTitle = (type: EventType): string => {
  switch (type) {
    case 'treasure_hunt':
      return 'Búsqueda del Tesoro';
    case 'skate_race':
      return 'Carrera de Skate';
    case 'my_custom_event':
      return 'Mi Evento Personalizado'; // Add here
    default:
      return 'Evento Comunitario';
  }
};

const EventIcon: React.FC<{ type: EventType }> = ({ type }) => {
  switch (type) {
    case 'treasure_hunt':
      return <span>💎</span>;
    case 'skate_race':
      return <span>🛹</span>;
    case 'my_custom_event':
      return <span>🎯</span>; // Add here
    default:
      return <span>🎉</span>;
  }
};
```

## Customization

### Change Event Duration

```typescript
// components/events/EventManager.tsx
const EVENT_DURATION = 10 * 60 * 1000; // 10 minutes instead of 5
```

### Change Event Frequency

```typescript
// components/events/EventManager.tsx
const EVENT_INTERVAL = 15 * 60 * 1000; // Every 15 minutes instead of 30
```

### Adjust Treasure Hunt

```typescript
// components/events/TreasureHunt.tsx
const generateChests = (): TreasureChestData[] => {
  const chestCount = 20; // More chests
  const worldSize = 60;  // Larger spawn area
  // ...
};

// Change coin reward
const handleCollect = (chestId: string) => {
  useGameStore.getState().addCoin(20); // 20 coins instead of 10
};
```

### Adjust Skate Race

```typescript
// components/events/SkateRace.tsx
const generateTrack = (): RaceCheckpointData[] => {
  const checkpointCount = 15; // More checkpoints
  const worldRadius = 40;     // Larger track
  // ...
};
```

### Customize Colors

**Treasure Chests:**
```typescript
// TreasureHunt.tsx
<meshStandardMaterial
  color="#FFD700"      // Gold
  metalness={0.8}
  roughness={0.2}
/>

// Change to silver:
<meshStandardMaterial
  color="#C0C0C0"      // Silver
  metalness={0.9}
  roughness={0.1}
/>
```

**Checkpoints:**
```typescript
// SkateRace.tsx
const color = isPassed ? '#4ade80' : isNext ? '#fbbf24' : '#60a5fa';
// Green for passed, yellow for next, blue for upcoming

// Change to red/orange/purple:
const color = isPassed ? '#ef4444' : isNext ? '#f97316' : '#a855f7';
```

### Disable Auto-Start (Testing)

```typescript
// components/events/EventManager.tsx
useEffect(() => {
  scheduleNextEvent();

  // Comment out auto-start:
  // const autoStart = setTimeout(() => {
  //   startEvent();
  // }, 60 * 1000);

  // return () => clearTimeout(autoStart);
}, [scheduleNextEvent, startEvent]);
```

### Add Event Notifications

```typescript
// components/events/EventManager.tsx
const startEvent = useCallback((type?: EventType) => {
  // ... existing code ...

  // Add notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('¡Evento Comenzando!', {
      body: `Nuevo evento: ${getEventTitle(eventType)}`,
      icon: '/icon.png',
    });
  }

  // Play sound
  playSound('coin');
}, []);
```

## Advanced Features

### Track Event Participation

```typescript
import { useEvents } from '../hooks';

function EventStats() {
  const { currentEvent, playerProgress, allProgress } = useEvents();

  if (!currentEvent) return null;

  return (
    <div>
      <h3>Event Stats</h3>
      <p>Your Score: {playerProgress?.score || 0}</p>
      <p>Total Players: {allProgress.size}</p>
      <ul>
        {Array.from(allProgress.values()).map((p) => (
          <li key={p.userId}>
            {p.username}: {p.score}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Custom Leaderboard Display

```typescript
import { useEvents } from '../hooks';

function CustomLeaderboard() {
  const { leaderboard } = useEvents();

  if (!leaderboard) return null;

  return (
    <div className="leaderboard">
      {leaderboard.rankings.map((entry, i) => (
        <div key={entry.userId} className={`rank-${i + 1}`}>
          <span>{i + 1}.</span>
          <span>{entry.username}</span>
          <span>{entry.score} pts</span>
          {entry.time && <span>{formatTime(entry.time / 1000)}</span>}
        </div>
      ))}
    </div>
  );
}
```

### Event-Specific Power-ups

```typescript
// In your event component:
const CollectablePowerup: React.FC<{ position: Vector3 }> = ({ position }) => {
  const playerPosition = useGameStore((s) => s.playerPosition);
  const [collected, setCollected] = useState(false);

  useEffect(() => {
    if (collected) return;

    const distance = Math.sqrt(
      (playerPosition[0] - position[0]) ** 2 +
      (playerPosition[1] - position[1]) ** 2 +
      (playerPosition[2] - position[2]) ** 2
    );

    if (distance < 1) {
      setCollected(true);
      // Apply power-up effect
      console.log('Speed boost activated!');
    }
  }, [playerPosition, position, collected]);

  if (collected) return null;

  return (
    <group position={position}>
      <Sphere args={[0.3]}>
        <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" />
      </Sphere>
    </group>
  );
};
```

## Troubleshooting

**Event not appearing:**
- Check browser console for errors
- Verify Supabase connection in Network tab
- Try manual trigger: `window.triggerEvent()`

**Player position not updating:**
- Ensure Player component is updating store
- Check `setPlayerPosition()` calls in Player.tsx
- Verify physics is running

**Performance issues:**
- Lower quality settings
- Reduce particle count in events
- Use distance culling for event objects
- Check frame rate with Performance Overlay (~)

**Leaderboard not syncing:**
- Verify Supabase channel subscription
- Check localStorage for fallback data
- Ensure event IDs match

## Support

For questions or issues:
1. Check EVENTS_SYSTEM.md for detailed docs
2. Review component source code comments
3. Test with `window.triggerEvent()` for debugging
4. Check browser console for error messages

---

**Happy Event Building! 🎉**
