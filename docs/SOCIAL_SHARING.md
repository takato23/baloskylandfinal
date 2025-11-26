# Social Sharing System Documentation

Instagram-optimized photo capture and social sharing features for Cozy City Explorer.

## Overview

The social sharing system allows players to capture, edit, and share their in-game photos across multiple platforms with a focus on Instagram Stories optimization. It includes screenshot capture, image processing, caption editing, hashtag suggestions, achievement tracking, and platform-specific sharing utilities.

## Files Created

### `/lib/social.ts`
Core utilities library for social sharing functionality.

**Key Functions:**

#### Screenshot Capture
```typescript
captureScreenshot(
  canvasElement?: HTMLCanvasElement,
  options?: CaptureOptions
): Promise<string>
```
Captures the game canvas and returns a data URL. Supports multiple aspect ratios:
- `1:1` - Instagram posts
- `4:5` - Instagram portrait
- `9:16` - Instagram Stories (default)
- `16:9` - Landscape
- `original` - No cropping

**Example:**
```typescript
import { captureScreenshot } from '@/lib/social';

const screenshot = await captureScreenshot(canvas, {
  quality: 0.95,
  format: 'png',
  aspectRatio: '9:16'
});
```

#### Image Download
```typescript
downloadImage(dataUrl: string, options?: DownloadOptions): void
```
Downloads captured image with automatic naming: `cozy-city-[date]-[filter].png`

**Example:**
```typescript
import { downloadImage } from '@/lib/social';

downloadImage(screenshot, {
  filter: 'vintage',
  timestamp: Date.now()
});
```

#### Instagram Stories Preparation
```typescript
prepareForInstagramStory(
  dataUrl: string,
  options?: InstagramStoryOptions
): Promise<string>
```
Optimizes images for Instagram Stories (1080x1920):
- Adds gradient background for letterboxing
- Centers image with proper aspect ratio
- Adds "Cozy City Explorer" watermark
- Supports caption and hashtag overlays

**Example:**
```typescript
import { prepareForInstagramStory } from '@/lib/social';

const storyImage = await prepareForInstagramStory(screenshot, {
  caption: 'Amazing sunset in Cozy City!',
  hashtags: ['#CozyCityExplorer', '#GoldenHour']
});
```

#### Social Platform Sharing
```typescript
shareToSocial(dataUrl: string, options: ShareOptions): Promise<boolean>
```
Platform-specific sharing with native Web Share API support on mobile:

**Platforms:**
- `instagram` - Optimized for Stories, Web Share API on mobile
- `twitter` - Opens Twitter intent with caption/hashtags
- `discord` - Downloads image and copies caption
- `facebook` - Opens Facebook share dialog

**Example:**
```typescript
import { shareToSocial } from '@/lib/social';

const success = await shareToSocial(screenshot, {
  platform: 'instagram',
  caption: 'Check out my catch!',
  hashtags: ['#CozyCityExplorer', '#Fishing'],
  url: 'https://cozycity.com/share/12345'
});
```

#### Clipboard Operations
```typescript
// Copy image (Chrome/Edge only)
copyImageToClipboard(dataUrl: string): Promise<boolean>

// Copy text
copyToClipboard(text: string): Promise<boolean>
```

#### Shareable Links
```typescript
generateShareableLink(photo: SavedPhoto, stats: PlayerStats): string
```
Creates shareable URLs with embedded player stats:
```
https://cozycity.com/share?photo=abc123&filter=vintage&fish=42&streak=7
```

#### Hashtag Generation
```typescript
generateHashtags(context: HashtagContext): string[]
```
Intelligent hashtag suggestions based on:
- Active filter (e.g., `#Vintage`, `#RetroVibes`)
- Time of day (`#GoldenHour`, `#NightPhotography`)
- Weather (`#RainyDay`, `#WinterWonderland`)
- Current event (`#Christmas`, `#Halloween`)
- Activity (`#Fishing`, `#BugCatching`)

Returns max 10 relevant hashtags.

**Example:**
```typescript
import { generateHashtags } from '@/lib/social';

const tags = generateHashtags({
  filter: 'sunset',
  timeOfDay: 'evening',
  weather: 'sunny',
  activity: 'fishing'
});
// Returns: ['#CozyCityExplorer', '#CozyCity', '#Sunset', '#GoldenHour', ...]
```

#### Social Achievement Tracking
```typescript
export const SOCIAL_ACHIEVEMENTS: SocialAchievement[]
```
7 built-in achievements:
- **Photographer** - Take first photo (100 coins)
- **Shutterbug** - Take 10 photos (vintage filter)
- **Influencer** - Take 50 photos (polaroid frame)
- **Social Butterfly** - Share first photo (sparkles sticker)
- **Going Viral** - Share 10 photos (confident pose)
- **Popular** - Get 100 likes (dreamy filter)
- **Challenge Master** - Complete 5 challenges (instagram frame)

### `/components/ui-components/SharePanel.tsx`
Full-featured sharing interface that appears after photo capture.

**Features:**

#### Photo Preview
- Full-screen photo display
- Toggle stats overlay (fish caught, streak, photos taken, days played)
- Challenge completion badges
- Filter/weather/time info display

#### Caption Editor
- 2200 character limit (Instagram standard)
- Real-time character counter
- Copy caption button
- Validation warnings

#### Hashtag Suggestions
- Auto-generated context-aware hashtags
- Click to toggle selection
- Custom hashtag input
- Visual tag chips with gradient styling

#### Share Buttons
Four platform-specific share buttons:
1. **Instagram** - Gradient yellow→pink→purple, Stories optimized
2. **Twitter/X** - Blue background, tweet intent
3. **Discord** - Indigo background, download + copy caption
4. **Download** - Green background, save to device

#### Additional Actions
- Copy image to clipboard
- Copy shareable link
- Stats overlay toggle
- Success/error notifications

#### Challenge Detection
Automatically detects if photo matches weekly challenges:
- Shows completion badge
- Lists matched challenges
- Displays rewards
- Suggests hashtags

**Usage Example:**
```tsx
import { SharePanel } from '@/components/ui-components/SharePanel';

<SharePanel
  photo={capturedPhoto}
  imageDataUrl={screenshotDataUrl}
  onClose={() => setShowSharePanel(false)}
  onSave={(updatedPhoto) => {
    // Handle photo save with share data
  }}
/>
```

## Integration with Photo Mode

The social sharing system integrates seamlessly with the existing photo mode:

### In `PhotoModeUI.tsx`
```typescript
import { SharePanel } from './SharePanel';
import { captureScreenshot } from '@/lib/social';

const [showSharePanel, setShowSharePanel] = useState(false);
const [capturedImage, setCapturedImage] = useState<string | null>(null);

const handleCapture = async () => {
  const canvas = document.querySelector('canvas');
  const screenshot = await captureScreenshot(canvas, {
    aspectRatio: '9:16',
    quality: 0.95
  });

  const photo = takePhoto();
  photo.fullImage = screenshot;
  photo.thumbnail = screenshot; // Or generate smaller version

  setCapturedImage(screenshot);
  setShowSharePanel(true);
};

// In render:
{showSharePanel && capturedImage && (
  <SharePanel
    photo={currentPhoto}
    imageDataUrl={capturedImage}
    onClose={() => setShowSharePanel(false)}
    onSave={savePhoto}
  />
)}
```

## Weekly Photo Challenges

Located in `/types/photo-mode.ts`:

```typescript
export const WEEKLY_PHOTO_CHALLENGES: PhotoChallenge[]
```

**Built-in Challenges:**
1. **Golden Hour** - Photo during sunset (500 coins)
2. **Rainy Mood** - Capture the rain (rain_drops sticker)
3. **Squad Goals** - Photo with 3+ friends (group_hug pose)
4. **Vintage Vibes** - Use retro filters (super_retro filter)

**Challenge Structure:**
```typescript
interface PhotoChallenge {
  id: string;
  name: string;
  nameEs: string;
  requirements: {
    filter?: PhotoFilter[];
    pose?: string[];
    timeOfDay?: ('morning' | 'day' | 'evening' | 'night')[];
    weather?: ('sunny' | 'rain' | 'snow')[];
    // ... more criteria
  };
  reward: {
    type: 'coins' | 'sticker' | 'filter' | 'pose' | 'frame';
    itemId?: string;
    amount?: number;
  };
  hashtag: string;
}
```

## Mobile Optimization

The system is fully mobile-optimized:

### Web Share API Integration
Automatically uses native share dialogs on mobile devices:
```typescript
if (navigator.share && isMobile()) {
  const blob = await dataUrlToBlob(storyImage);
  const file = new File([blob], 'cozy-city-photo.jpg', { type: 'image/jpeg' });

  await navigator.share({
    title: 'Cozy City Explorer',
    text: caption,
    files: [file]
  });
}
```

### Responsive UI
SharePanel uses responsive Tailwind classes:
- Full-screen on mobile
- Modal on desktop
- Touch-optimized buttons
- Scrollable content areas

## Instagram Stories Best Practices

### Optimal Dimensions
- **Resolution**: 1080x1920 pixels (9:16 ratio)
- **File Size**: <4MB for best performance
- **Format**: JPEG for photos, MP4 for video

### Our Implementation
```typescript
prepareForInstagramStory() {
  // Creates 1080x1920 canvas
  // Adds gradient background
  // Centers and letterboxes image
  // Adds subtle watermark
  // Exports as JPEG at 95% quality
}
```

### Recommended Workflow
1. Player takes photo in game
2. System captures at 9:16 ratio
3. `SharePanel` appears with preview
4. Player adds caption and hashtags
5. Clicks Instagram button
6. Image automatically prepared for Stories
7. Web Share API opens Instagram (mobile)
8. Manual download instructions (desktop)

## Analytics & Tracking

### Simulated Engagement
```typescript
simulateLikes(photo: SavedPhoto): number
```
Generates engagement score based on:
- Base score: 10 likes
- Filter bonus: +5
- Frame bonus: +5
- Caption bonus: +10
- Random factor: 0-20

### Share Tracking
Photos track sharing data:
```typescript
interface SavedPhoto {
  shared: boolean;
  sharedTo?: ('instagram' | 'twitter' | 'discord')[];
  likes: number;
}
```

### Gallery Statistics
```typescript
interface PhotoGallery {
  totalPhotos: number;
  totalLikes: number;
  totalShares: number;
}
```

## Future Enhancements

### Planned Features
1. **Backend Integration** - Real like/share tracking
2. **Photo Contests** - Weekly community challenges
3. **AR Stickers** - Face filters and 3D stickers
4. **Video Capture** - Short gameplay clips
5. **Collaborative Photos** - Multi-player group shots
6. **Photo Editing** - Advanced filters and adjustments
7. **NFT Minting** - Blockchain photo ownership
8. **Print Service** - Physical photo prints

### API Considerations
Future backend API structure:
```typescript
// POST /api/photos
interface UploadPhotoRequest {
  image: File;
  caption: string;
  hashtags: string[];
  metadata: PhotoMetadata;
}

// GET /api/photos/:id/likes
interface LikesResponse {
  likes: number;
  likedBy: string[];
}

// POST /api/photos/:id/share
interface ShareRequest {
  platform: 'instagram' | 'twitter' | 'discord';
  timestamp: number;
}
```

## Browser Compatibility

### Full Support (All Features)
- Chrome/Edge 90+ (Clipboard API, Web Share API)
- Safari 15+ (Web Share API on iOS)
- Firefox 90+ (Limited clipboard support)

### Fallback Features
- Older browsers: Download-based workflow
- No Web Share API: Platform-specific URLs
- No Clipboard API: Manual copy instructions

## Performance Considerations

### Image Optimization
```typescript
// Recommended settings
{
  quality: 0.95,  // High quality, reasonable size
  format: 'jpeg', // Better compression than PNG
  maxWidth: 1080, // Instagram optimal
  maxHeight: 1920 // Instagram optimal
}
```

### Canvas Performance
- Uses temporary canvas for processing
- Immediate cleanup after conversion
- Async processing to avoid blocking
- Progressive loading for large images

## Troubleshooting

### Common Issues

**Image not capturing:**
```typescript
// Ensure canvas element exists
const canvas = document.querySelector('canvas');
if (!canvas) {
  console.error('No canvas found');
}
```

**Web Share API not working:**
```typescript
// Check browser support
if (!navigator.share) {
  console.log('Web Share API not supported, using fallback');
}
```

**Clipboard copy failing:**
```typescript
// Chrome/Edge only feature
if (!navigator.clipboard) {
  alert('Clipboard API not supported. Use download instead.');
}
```

## Testing

### Manual Test Checklist
- [ ] Photo capture works on desktop/mobile
- [ ] All aspect ratios render correctly
- [ ] Instagram Stories format is 1080x1920
- [ ] Hashtag generation is contextual
- [ ] Challenge detection works
- [ ] Web Share API activates on mobile
- [ ] Download fallback works
- [ ] Caption character limit enforced
- [ ] Stats overlay displays correctly
- [ ] All platform share buttons functional

### Test Data
```typescript
const testPhoto: SavedPhoto = {
  id: 'test_123',
  takenAt: Date.now(),
  location: 'Test City',
  filter: 'vintage',
  frame: 'polaroid',
  pose: 'peace',
  caption: 'Test photo for social sharing',
  weather: 'sunny',
  timeOfDay: 'day',
  likes: 0,
  shared: false
};
```

## License & Credits

Part of Cozy City Explorer game.
Instagram Stories optimization based on Meta's [official guidelines](https://help.instagram.com/1631821640426723).

