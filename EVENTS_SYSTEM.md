# Community Events System

A real-time multiplayer events system for Cozy City Explorer that supports 100+ concurrent participants with beautiful 3D elements, real-time synchronization, and engaging gameplay.

## Features

- **🏆 Treasure Hunt**: Collect golden chests scattered around the city before others do
- **🛹 Skate Race**: Complete a race course with checkpoints and ghost racer of best time
- **📊 Real-time Leaderboards**: See rankings update live as players compete
- **🎯 Event Scheduling**: Auto-scheduled events every 30 minutes
- **✨ Beautiful 3D Effects**: Glowing chests, particle effects, checkpoint rings
- **💰 Coin Rewards**: Winners receive coin rewards
- **📱 Mobile Support**: Full touch controls and optimized performance

## Architecture

### Components

#### 1. **TreasureHunt** (`components/events/TreasureHunt.tsx`)
- Spawns 15 golden treasure chests randomly across the city
- Chests rotate, bob, and emit golden particles
- First player to reach a chest collects it (10 coins)
- 5-minute time limit
- Real-time chest collection sync across all players

**Key Features:**
- Glowing golden chests with metalness/roughness materials
- Point lights for atmospheric glow
- Sparkle particle effects (8 particles per chest)
- Collision detection using Rapier physics sensors
- Broadcast chest collection to all players

#### 2. **SkateRace** (`components/events/SkateRace.tsx`)
- 10 checkpoints forming a race track around the city
- Glowing checkpoint rings (torus geometry)
- Ghost racer showing best recorded time
- Start/finish line with checkered pattern
- Lap time tracking and display

**Key Features:**
- Color-coded checkpoints (blue → yellow for next → green for passed)
- Checkpoint numbers displayed with Text component
- Point lights for dramatic effect
- Ghost racer AI following checkpoint path
- Best time persistence in localStorage
- Auto-enters skateboard mode

#### 3. **EventManager** (`components/events/EventManager.tsx`)
- Central event orchestrator and scheduler
- Automatic event scheduling (30-minute intervals)
- Event lifecycle management (scheduled → starting → active → finished)
- 30-second countdown before event start
- Score submission and leaderboard generation
- Event history tracking

**Key Features:**
- Window-level `triggerEvent()` function for manual triggers
- Event state broadcasting via Supabase channels
- Participant tracking
- Automatic event rotation between types
- Event history persistence

#### 4. **EventBanner** (`components/ui-components/EventBanner.tsx`)
- Top-center UI overlay showing current event
- Countdown timer
- Participant count
- Join event button
- Event-specific icons and titles
- Results leaderboard with rankings

**Key Features:**
- Gradient backgrounds (purple → pink → orange)
- Animated countdown
- Player progress display
- Medal icons for top 3 (🥇🥈🥉)
- Auto-hide results after 15 seconds
- Mobile-responsive design

### Backend Integration

#### **lib/events.ts**
Core Supabase integration for real-time event broadcasting:

```typescript
// Event Broadcasting
- broadcastEventStart(event)
- broadcastEventUpdate(eventId, progress)
- broadcastEventEnd(eventId, leaderboard)
- broadcastChestCollected(eventId, chestId, userId)
- broadcastCheckpointPassed(eventId, userId, checkpointIndex, time)

// Score Management
- submitEventScore(eventId, userId, username, score, time)
- getEventLeaderboard(eventId)
- getEventHistory()
- saveEventToHistory(event)

// Utilities
- generateEventId()
- isEventActive(event)
- getTimeRemaining(event)
- formatTime(seconds)
```

**Fallback Strategy:**
- Uses localStorage when Supabase unavailable
- Graceful degradation for offline play
- Local score tracking and leaderboards

#### **hooks/useEvents.ts**
React hook for event state management:

```typescript
const {
  currentEvent,      // Active/scheduled event
  isParticipating,   // Whether player joined
  leaderboard,       // Event rankings
  playerProgress,    // Local player progress
  allProgress,       // Map of all player progress
  joinEvent,         // Join event function
  leaveEvent,        // Leave event function
  updateProgress,    // Update score/position
  submitFinalScore,  // Submit final score
} = useEvents();
```

## Usage

### Triggering Events Manually

Events auto-start every 30 minutes, but you can trigger them manually from the browser console:

```javascript
// Trigger treasure hunt
window.triggerEvent('treasure_hunt');

// Trigger skate race
window.triggerEvent('skate_race');

// Trigger random event
window.triggerEvent();
```

### Event Flow

1. **Scheduled** → Event scheduled 30 minutes in advance
2. **Starting** → 30-second countdown with prominent UI banner
3. **Active** → Event running, 5-minute duration
4. **Ending** → Timer reaches 0, final scores submitted
5. **Finished** → Leaderboard displayed for 15 seconds

### Participation

**For Players:**
1. Event banner appears at top of screen
2. Click "¡PARTICIPAR!" button to join
3. Complete event objectives (collect chests or pass checkpoints)
4. Submit final score automatically at event end
5. View leaderboard results

**For Developers:**
- Events integrate seamlessly with existing game systems
- Player position tracking via Zustand store
- Physics collision detection for interactions
- Real-time broadcasting via Supabase channels
- Coin rewards added via `addCoin()` action

## Performance

### Optimization Strategies

1. **Instance-based rendering** for multiple chests (planned)
2. **Quality-level checks** to disable particles on low-end devices
3. **Distance culling** for far-away event objects
4. **LOD (Level of Detail)** for checkpoint rings
5. **Efficient collision detection** using Rapier sensors
6. **Throttled position updates** (10Hz) to reduce network traffic

### Scalability

- **100+ concurrent players** supported via Supabase Realtime
- **Broadcast rate limiting** (10 events/second per client)
- **State aggregation** in EventManager
- **LocalStorage fallback** for offline mode
- **Optimistic UI updates** for instant feedback

## Configuration

### Timing Constants

```typescript
EVENT_INTERVAL = 30 * 60 * 1000;     // 30 minutes
EVENT_DURATION = 5 * 60 * 1000;      // 5 minutes
COUNTDOWN_DURATION = 30 * 1000;       // 30 seconds
```

### Event Types

```typescript
type EventType = 'treasure_hunt' | 'skate_race';
```

Add new event types by:
1. Creating new component in `components/events/`
2. Adding type to `EVENT_TYPES` array
3. Adding case in EventManager render
4. Implementing event logic with `onComplete` callback

### Treasure Hunt Settings

```typescript
const chestCount = 15;          // Number of chests
const worldSize = 45;            // Spawn radius
const coinReward = 10;           // Coins per chest
```

### Race Settings

```typescript
const checkpointCount = 10;      // Number of checkpoints
const worldRadius = 35;          // Track size
const collectionDistance = 2;    // Trigger distance for checkpoint
```

## API Reference

### EventState

```typescript
interface EventState {
  id: string;
  type: EventType;
  status: EventStatus;
  startTime: number;
  endTime: number;
  duration: number;
  participants: string[];
  countdown?: number;
}
```

### EventBroadcast

```typescript
interface EventBroadcast {
  type: 'event_start' | 'event_update' | 'event_end' | 'chest_collected' | 'checkpoint_passed';
  eventId: string;
  payload: any;
  timestamp: number;
}
```

### PlayerEventProgress

```typescript
interface PlayerEventProgress {
  userId: string;
  username: string;
  score: number;
  position?: Vector3;
  lastUpdate: number;
}
```

## Future Enhancements

### Planned Features

1. **More Event Types**
   - Hide & Seek
   - Tag/Chase game
   - Coin collection frenzy
   - Dance-off competition
   - Building challenges

2. **Advanced Features**
   - Custom event creation by players
   - Event voting system
   - Seasonal/holiday events
   - Team-based events
   - Power-ups during events

3. **Rewards System**
   - Exclusive items for winners
   - Achievement badges
   - Event leaderboard history
   - Seasonal rankings
   - Special character skins

4. **Social Features**
   - Event notifications
   - Friend invites
   - Spectator mode
   - Replays of best performances
   - Social media sharing

## Troubleshooting

### Events Not Starting

- Check Supabase configuration in `.env.local`
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check browser console for connection errors
- Use `window.triggerEvent()` for manual testing

### Chest/Checkpoint Not Detecting

- Ensure player is within collection distance (1.5 units for chests, 2 units for checkpoints)
- Check collision sensors are enabled
- Verify player position is updating in store
- For races, must be on skateboard (`isDriving === true`)

### Leaderboard Not Updating

- Check Supabase channel subscription status
- Verify event broadcasts in network tab
- Check localStorage for fallback data
- Ensure event ID matches between components

### Performance Issues

- Lower quality level in settings
- Reduce particle count in TreasureHunt
- Disable ghost racer in SkateRace
- Use distance culling for far events
- Check frame rate with Performance Overlay (~)

## Testing

### Local Testing

```bash
# Start dev server
npm run dev

# In browser console:
window.triggerEvent('treasure_hunt')
window.triggerEvent('skate_race')
```

### Multiplayer Testing

1. Open game in multiple browser tabs
2. Trigger event in one tab
3. Verify event appears in all tabs
4. Test participation and score sync
5. Check leaderboard consistency

## Credits

Built with:
- **React Three Fiber** - 3D rendering
- **@react-three/rapier** - Physics engine
- **Supabase** - Real-time backend
- **Zustand** - State management
- **Tailwind CSS** - UI styling

---

**Made with ❤️ for the Cozy City Explorer community!**
