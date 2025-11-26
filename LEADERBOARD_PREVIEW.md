# Leaderboard Visual Preview

## UI Layout

```
┌────────────────────────────────────────────────────┐
│  🏆 Leaderboard                               ×   │
│  1,234 players                                     │
│                                                    │
│  [Daily]  [Weekly]  [All Time]  ← Period Tabs    │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│                                                    │
│  ┌──────────────────────────────────────────────┐│
│  │ 🥇  🐻  BearMaster        12,450 🪙         ││  ← Top 1
│  └──────────────────────────────────────────────┘│
│                                                    │
│  ┌──────────────────────────────────────────────┐│
│  │ 🥈  🐱  CatNinja          10,320 🪙         ││  ← Top 2
│  └──────────────────────────────────────────────┘│
│                                                    │
│  ┌──────────────────────────────────────────────┐│
│  │ 🥉  🦊  FoxyPlayer         9,876 🪙         ││  ← Top 3
│  └──────────────────────────────────────────────┘│
│                                                    │
│  ┌──────────────────────────────────────────────┐│
│  │ #4  🐶  DoggoFan           8,543 🪙         ││
│  └──────────────────────────────────────────────┘│
│                                                    │
│  ┌──────────────────────────────────────────────┐│
│  │ #5  🐼  PandaPower         7,234 🪙         ││
│  └──────────────────────────────────────────────┘│
│                                                    │
│  ...more entries...                                │
│                                                    │
│  ┌──────────────────────────────────────────────┐│
│  │ #10 🦁  LionKing           5,432 🪙         ││
│  └──────────────────────────────────────────────┘│
│                                                    │
│  ─ ─ ─ ─ ─ ─ ─ Your Rank ─ ─ ─ ─ ─ ─ ─         │
│                                                    │
│  ┌──────────────────────────────────────────────┐│
│  │ #42 🐰  You [YOU]          2,156 🪙   ← Highlight
│  └──────────────────────────────────────────────┘│
│                                                    │
│  Last updated: 3:45:12 PM                          │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│  Your Current Coins:          2,156 🪙             │
└────────────────────────────────────────────────────┘
```

## Color Scheme

### Header
- Background: Gradient from yellow-500 to orange-600
- Text: White
- Trophy icon: 🏆

### Background
- Main: Gradient from purple-900/95 to blue-900/95
- Border: White with 20% opacity
- Backdrop: Blur effect

### Tabs
- Active: Gradient yellow-400 to orange-500, white text, shadow
- Inactive: White/20%, hover: White/30%

### Entries
- Top 3: White/15% background
- Others: White/5% background
- Hover: Slightly brighter
- Current Player: Blue gradient with border

### Medals
- 1st: 🥇 Gold
- 2nd: 🥈 Silver
- 3rd: 🥉 Bronze
- Rest: #Rank

### Text
- Username: White, bold, large
- Animal type: White/60%, small, capitalized
- Coins: Yellow-400, bold, large
- Rank: White/70%

## Animation Effects

1. **Opening**: Fade in with backdrop blur
2. **Tabs**: Scale up slightly when active
3. **Medals**: Bounce animation with staggered delay
4. **Entries**: Smooth transitions on hover
5. **Current Player**: Subtle pulse effect
6. **Loading**: Spinning coin animation

## Responsive Behavior

### Desktop (>768px)
- Max width: 2xl (672px)
- Full modal with all features
- Hover effects enabled

### Mobile (<768px)
- Full width with padding
- Touch-friendly tabs
- Scrollable list
- No hover effects (tap instead)

## Interactive Elements

1. **Close Button (×)**: Top right, white circle
2. **Period Tabs**: Click to switch between Daily/Weekly/All-time
3. **Scroll Area**: Smooth scrolling for long lists
4. **Refresh**: Auto-refresh every 30 seconds

## Real-time Updates

When another player collects coins:
1. Entry updates smoothly
2. Rank changes with animation
3. No page reload needed
4. "Last updated" timestamp refreshes

## Empty State

When no players exist:
```
┌────────────────────────────────────────────┐
│           🏅                               │
│                                            │
│      No players yet!                       │
│      Be the first to collect coins!        │
└────────────────────────────────────────────┘
```

## Loading State

While fetching data:
```
┌────────────────────────────────────────────┐
│           ⟳                                │
│                                            │
│      Loading leaderboard...                │
└────────────────────────────────────────────┘
```

## Animal Avatars

Each player's avatar shows their animal type with a circular background that uses their character colors:

```
┌──────┐
│  🐻  │  ← Bear (with skin color background)
└──────┘
```

The background is a gradient from their skin color to their shirt color.

## Example Data Flow

1. User opens leaderboard → Shows loading state
2. Data fetched from Supabase → Displays top 10
3. User not in top 10 → Shows "Your Rank" separator + user's entry
4. Real-time update → Entry smoothly updates with new coins
5. User closes leaderboard → Modal fades out

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- High contrast option available
- Touch-friendly targets (min 44x44px)
- Focus indicators visible

## Performance

- Lazy loaded component
- 30-second cache
- Optimistic updates
- Smooth 60fps animations
- Small bundle size (~20KB)

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support
- IE11: Not supported (modern browsers only)
