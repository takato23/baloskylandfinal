# Leaderboard Integration Guide

This guide shows how to integrate the leaderboard system into the Cozy City Explorer game.

## Files Created

1. **lib/database.types.ts** - Updated with leaderboard table types
2. **lib/leaderboard.ts** - Supabase integration for leaderboard operations
3. **components/ui-components/Leaderboard.tsx** - Beautiful leaderboard UI component
4. **store.ts** - Added leaderboard state management

## Database Setup

Run the following SQL in your Supabase SQL Editor to create the leaderboard table:

```sql
-- See the SQL schema comments in lib/database.types.ts (lines 184-269)
-- Copy and paste the entire SQL block to set up:
-- - leaderboard table
-- - indexes for performance
-- - RLS policies
-- - helper functions for rank updates and periodic resets
```

## Integration into UI Component

Add the following to your `components/UI.tsx` file:

### 1. Import the Leaderboard component

```typescript
import { Leaderboard } from './ui-components';
```

### 2. Add leaderboard state to the UI component

```typescript
export const UI: React.FC = () => {
  // ... existing state ...

  const showLeaderboard = useGameStore((s) => s.showLeaderboard);
  const setShowLeaderboard = useGameStore((s) => s.setShowLeaderboard);

  // ... rest of component ...
```

### 3. Add a trophy button to the HUD

Update the `HUD` component to include a leaderboard button:

```typescript
const HUD: React.FC<HUDProps> = memo(
  ({ coins, isDriving, isHidden, onEditCharacter, onStartDriving, onShare, onShowLeaderboard }) => {
    return (
      <div className={`...`}>
        {/* Existing buttons */}

        {/* Leaderboard Button */}
        <button
          onClick={onShowLeaderboard}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 border-2 border-black px-4 py-2 rounded-full shadow-lg font-bold text-sm text-white hover:opacity-90 transition-all active:scale-95 pointer-events-auto"
        >
          🏆 Ranking
        </button>
      </div>
    );
  }
);
```

### 4. Add callback function

```typescript
const handleShowLeaderboard = useCallback(() => {
  setShowLeaderboard(true);
  playSound('coin'); // Optional: play sound when opening
}, [setShowLeaderboard]);
```

### 5. Render the Leaderboard component

Add this to the return statement of your UI component:

```typescript
return (
  <>
    {/* Existing UI components */}

    {/* Leaderboard */}
    <Leaderboard
      isOpen={showLeaderboard}
      onClose={() => setShowLeaderboard(false)}
      currentUserId={userId} // Use your multiplayer user ID here
    />
  </>
);
```

## Submitting Scores

Add this effect to automatically submit scores when coins change:

```typescript
import { submitScore } from '../lib/leaderboard';

useEffect(() => {
  const character = useGameStore.getState().character;
  const username = localStorage.getItem('username') || 'Anonymous';
  const userId = localStorage.getItem('userId') || 'guest';

  // Submit score whenever coins change
  if (coins > 0) {
    submitScore(userId, username, coins, {
      type: character.type,
      skin: character.skin,
      shirt: character.shirt,
      pants: character.pants,
      accessory: character.accessory,
    });
  }
}, [coins]);
```

## Complete Example Integration

Here's a minimal complete example:

```typescript
// components/UI.tsx

import { Leaderboard } from './ui-components';
import { submitScore } from '../lib/leaderboard';

export const UI: React.FC = () => {
  // State
  const coins = useGameStore((s) => s.coins);
  const showLeaderboard = useGameStore((s) => s.showLeaderboard);
  const setShowLeaderboard = useGameStore((s) => s.setShowLeaderboard);
  const character = useGameStore((s) => s.character);

  // Get user ID from multiplayer system or localStorage
  const userId = localStorage.getItem('userId') || `guest-${Date.now()}`;
  const username = localStorage.getItem('username') || 'Anonymous';

  // Submit score when coins change
  useEffect(() => {
    if (coins > 0) {
      submitScore(userId, username, coins, {
        type: character.type,
        skin: character.skin,
        shirt: character.shirt,
        pants: character.pants,
        accessory: character.accessory,
      });
    }
  }, [coins, character, userId, username]);

  // Handlers
  const handleShowLeaderboard = useCallback(() => {
    setShowLeaderboard(true);
  }, [setShowLeaderboard]);

  return (
    <>
      {/* HUD with leaderboard button */}
      <HUD
        coins={coins}
        isDriving={isDriving}
        isHidden={isHidden}
        onEditCharacter={handleEditCharacter}
        onStartDriving={handleStartDriving}
        onShare={handleShare}
        onShowLeaderboard={handleShowLeaderboard}
      />

      {/* Leaderboard modal */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentUserId={userId}
      />
    </>
  );
};
```

## Features Implemented

### UI Features
- **Beautiful Design**: Gradient backgrounds, animated medals, and smooth transitions
- **Period Tabs**: Daily, Weekly, and All-time rankings
- **Top 10 Display**: Shows top 10 players with medals for top 3
- **Current Player Rank**: Shows your rank even if not in top 10
- **Animal Avatars**: Shows each player's animal type with emoji
- **Character Customization**: Displays each player's character appearance
- **Real-time Updates**: Live updates when players collect coins
- **Offline Support**: Caches leaderboard data for offline viewing

### Backend Features
- **Real-time Subscriptions**: Updates automatically via Supabase realtime
- **Efficient Queries**: Indexed for fast lookups with 100+ concurrent users
- **Periodic Resets**: Daily/weekly coin tracking with automatic resets
- **Rank Calculation**: Automatic rank updates based on scores
- **Caching**: 30-second cache to reduce database queries

## Performance Considerations

- **Indexes**: Created on coins, daily_coins, weekly_coins for fast sorting
- **Caching**: 30-second cache reduces database load
- **Lazy Loading**: Leaderboard component can be lazy-loaded
- **Pagination**: Currently shows top 10, can be extended for pagination
- **Real-time**: Uses Supabase realtime for efficient updates

## Customization

### Change Update Frequency

In `lib/leaderboard.ts`, modify the `CACHE_TTL` constant:

```typescript
const CACHE_TTL = 30000; // 30 seconds (change as needed)
```

### Change Number of Entries

When calling `fetchLeaderboard`, pass a different limit:

```typescript
await fetchLeaderboard('alltime', userId, 20); // Show top 20
```

### Add More Periods

You can extend the `LeaderboardPeriod` type in `lib/leaderboard.ts`:

```typescript
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';
```

## Troubleshooting

### Leaderboard not showing data
1. Check Supabase is configured in `.env.local`
2. Verify SQL schema was run in Supabase
3. Check browser console for errors

### Real-time updates not working
1. Verify realtime is enabled for the leaderboard table
2. Check Supabase realtime quota
3. Ensure RLS policies are set correctly

### Slow performance
1. Verify indexes were created
2. Increase cache TTL
3. Reduce number of entries shown

## Environment Variables

Make sure these are set in your `.env.local`:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Next Steps

1. Set up Supabase cron jobs to call `reset_periodic_coins()` daily/weekly
2. Add pagination for viewing more than 10 entries
3. Add filtering by character type or other criteria
4. Add achievements and badges system
5. Add social features like following players
