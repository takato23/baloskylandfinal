import * as THREE from 'three';

// Simple, lightweight materials for mobile performance
// No procedural textures - just solid colors with minimal properties

export const Materials = {
  // Ground & Nature - Enhanced colors
  Grass: new THREE.MeshStandardMaterial({ color: '#7DB868', roughness: 0.85, metalness: 0.02 }), // Vibrant grass
  GrassLight: new THREE.MeshStandardMaterial({ color: '#9ACC88', roughness: 0.8, metalness: 0.02 }), // Light grass patches
  GrassDark: new THREE.MeshStandardMaterial({ color: '#5A9848', roughness: 0.88, metalness: 0.02 }), // Shaded grass
  DarkGreen: new THREE.MeshStandardMaterial({ color: '#5A8A4D', roughness: 0.85 }),
  Brown: new THREE.MeshStandardMaterial({ color: '#8A5F3D', roughness: 0.75 }),
  Dirt: new THREE.MeshStandardMaterial({ color: '#8B7355', roughness: 0.9 }), // Dirt path

  // Buildings - Enhanced cozy European style colors
  BuildingA: new THREE.MeshStandardMaterial({ color: '#FFF5E6', roughness: 0.65, metalness: 0.02 }), // Warm cream
  BuildingB: new THREE.MeshStandardMaterial({ color: '#F5E1D0', roughness: 0.68, metalness: 0.02 }), // Soft peach
  BuildingC: new THREE.MeshStandardMaterial({ color: '#E8D4B8', roughness: 0.65, metalness: 0.02 }), // Sand
  BuildingD: new THREE.MeshStandardMaterial({ color: '#D4A574', roughness: 0.7, metalness: 0.02 }), // Terracotta light
  BuildingE: new THREE.MeshStandardMaterial({ color: '#C4956A', roughness: 0.68, metalness: 0.02 }), // Warm brown
  BuildingF: new THREE.MeshStandardMaterial({ color: '#E0D8D0', roughness: 0.6, metalness: 0.02 }), // Light gray
  BuildingG: new THREE.MeshStandardMaterial({ color: '#F0E8D8', roughness: 0.65, metalness: 0.02 }), // Ivory
  BuildingCream: new THREE.MeshStandardMaterial({ color: '#FFF8E8', roughness: 0.6, metalness: 0.02 }),
  BuildingBlue: new THREE.MeshStandardMaterial({ color: '#D4E8F0', roughness: 0.55, metalness: 0.03 }), // Soft blue
  BuildingGlass: new THREE.MeshStandardMaterial({ color: '#C8E4F0', transparent: true, opacity: 0.75, roughness: 0.08, metalness: 0.15 }),
  BuildingPink: new THREE.MeshStandardMaterial({ color: '#F8E0E0', roughness: 0.6, metalness: 0.02 }), // Soft pink
  BuildingMint: new THREE.MeshStandardMaterial({ color: '#E0F0E8', roughness: 0.6, metalness: 0.02 }), // Mint
  BuildingYellow: new THREE.MeshStandardMaterial({ color: '#FFF0C8', roughness: 0.6, metalness: 0.02 }), // Soft yellow

  // Roofs - Enhanced with more variety
  Roof: new THREE.MeshStandardMaterial({ color: '#B86830', roughness: 0.7, metalness: 0.02 }), // Terracotta
  RoofBlue: new THREE.MeshStandardMaterial({ color: '#5A8898', roughness: 0.65, metalness: 0.03 }), // Slate blue
  RoofGreen: new THREE.MeshStandardMaterial({ color: '#5A8858', roughness: 0.65, metalness: 0.02 }), // Forest green
  RoofDark: new THREE.MeshStandardMaterial({ color: '#4A5560', roughness: 0.7, metalness: 0.04 }), // Dark slate
  RoofPink: new THREE.MeshStandardMaterial({ color: '#C87868', roughness: 0.65, metalness: 0.02 }), // Salmon
  RoofYellow: new THREE.MeshStandardMaterial({ color: '#D4A040', roughness: 0.65, metalness: 0.02 }), // Ochre
  RoofMint: new THREE.MeshStandardMaterial({ color: '#88C0B0', roughness: 0.6, metalness: 0.02 }), // Mint
  RoofBrown: new THREE.MeshStandardMaterial({ color: '#6B4A3A', roughness: 0.75, metalness: 0.02 }), // Dark brown
  RoofRed: new THREE.MeshStandardMaterial({ color: '#A84030', roughness: 0.7, metalness: 0.02 }), // Classic red

  // Water
  Water: new THREE.MeshStandardMaterial({ color: '#A4D2C8', transparent: true, opacity: 0.8, roughness: 0.1 }),

  // Stone & Concrete
  Stone: new THREE.MeshStandardMaterial({ color: '#d4cec2', roughness: 0.6 }),
  StoneCream: new THREE.MeshStandardMaterial({ color: '#f0e8d8', roughness: 0.6 }),
  StoneGray: new THREE.MeshStandardMaterial({ color: '#b8b0a8', roughness: 0.6 }),

  // Roads & Sidewalks - Enhanced with more realistic colors
  Asphalt: new THREE.MeshStandardMaterial({ color: '#2D2D2D', roughness: 0.92, metalness: 0.02 }),
  AsphaltDetailed: new THREE.MeshStandardMaterial({ color: '#353535', roughness: 0.88, metalness: 0.03 }),
  AsphaltLight: new THREE.MeshStandardMaterial({ color: '#424242', roughness: 0.85 }),
  Sidewalk: new THREE.MeshStandardMaterial({ color: '#E8E4DC', roughness: 0.75 }),
  SidewalkTiled: new THREE.MeshStandardMaterial({ color: '#D8D4CC', roughness: 0.7 }),
  SidewalkBrick: new THREE.MeshStandardMaterial({ color: '#C4A882', roughness: 0.78 }),
  Cobblestone: new THREE.MeshStandardMaterial({ color: '#A89478', roughness: 0.82 }),
  CobblestoneLight: new THREE.MeshStandardMaterial({ color: '#C8B898', roughness: 0.78 }),
  Curb: new THREE.MeshStandardMaterial({ color: '#D0C8C0', roughness: 0.8 }),
  CurbDark: new THREE.MeshStandardMaterial({ color: '#8A8480', roughness: 0.85 }),
  CurbYellow: new THREE.MeshStandardMaterial({ color: '#E8C84C', roughness: 0.7 }),

  // Road markings
  PaintWhite: new THREE.MeshStandardMaterial({ color: '#F7F7F7', roughness: 0.85 }),
  PaintYellow: new THREE.MeshStandardMaterial({ color: '#F2C94C', roughness: 0.8 }),
  PaintWhiteWorn: new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.88 }),
  PaintYellowWorn: new THREE.MeshStandardMaterial({ color: '#d9b846', roughness: 0.85 }),

  // Wet surfaces
  AsphaltWet: new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.3 }),
  SidewalkWet: new THREE.MeshStandardMaterial({ color: '#b8b4ac', roughness: 0.25 }),

  // Traffic
  TrafficBlack: new THREE.MeshStandardMaterial({ color: '#2F3033', roughness: 0.45 }),
  LightRed: new THREE.MeshStandardMaterial({ color: '#E07A5F', emissive: '#E07A5F', emissiveIntensity: 1.5 }),
  LightAmber: new THREE.MeshStandardMaterial({ color: '#F2C94C', emissive: '#F2C94C', emissiveIntensity: 1 }),
  LightGreen: new THREE.MeshStandardMaterial({ color: '#58A182', emissive: '#58A182', emissiveIntensity: 1.5 }),

  // Metals
  Bronze: new THREE.MeshStandardMaterial({ color: '#cd7f32', metalness: 0.6, roughness: 0.4 }),
  Silver: new THREE.MeshStandardMaterial({ color: '#ececec', metalness: 0.8, roughness: 0.2 }),
  Gold: new THREE.MeshStandardMaterial({ color: '#ffc107', metalness: 0.9, roughness: 0.15 }),
  Metal: new THREE.MeshStandardMaterial({ color: '#8EA0A8', roughness: 0.35, metalness: 0.65 }),

  // Glass
  Glass: new THREE.MeshStandardMaterial({ color: '#B5D7E8', transparent: true, opacity: 0.7, roughness: 0.1 }),
  GlassGreen: new THREE.MeshStandardMaterial({ color: '#A4D2C8', transparent: true, opacity: 0.7, roughness: 0.1 }),

  // Special materials
  Terracotta: new THREE.MeshStandardMaterial({ color: '#C7785A', roughness: 0.7 }),
  BrickRed: new THREE.MeshStandardMaterial({ color: '#C7785A', roughness: 0.7 }),
  ClinicalWhite: new THREE.MeshStandardMaterial({ color: '#FDF9F2', roughness: 0.5 }),

  // Shops & Buildings
  VendingRed: new THREE.MeshStandardMaterial({ color: '#E07A5F', roughness: 0.5 }),
  VendingBlue: new THREE.MeshStandardMaterial({ color: '#5F8CA8', roughness: 0.5 }),
  BurgerBun: new THREE.MeshStandardMaterial({ color: '#D7A94F', roughness: 0.7 }),
  BurgerMeat: new THREE.MeshStandardMaterial({ color: '#4a2b23', roughness: 0.7 }),
  IceCreamPink: new THREE.MeshStandardMaterial({ color: '#F48FB1', roughness: 0.6 }),
  IceCreamCone: new THREE.MeshStandardMaterial({ color: '#D7CCC8', roughness: 0.7 }),
  PostBlue: new THREE.MeshStandardMaterial({ color: '#3B6FA0', roughness: 0.5 }),
  PostYellow: new THREE.MeshStandardMaterial({ color: '#F2C94C', roughness: 0.6 }),

  // Awnings
  AwningRed: new THREE.MeshStandardMaterial({ color: '#C7785A', roughness: 0.6 }),
  AwningGreen: new THREE.MeshStandardMaterial({ color: '#4F7A3F', roughness: 0.6 }),
  AwningStripe: new THREE.MeshStandardMaterial({ color: '#C7785A', roughness: 0.6 }),
  AwningStripeWhite: new THREE.MeshStandardMaterial({ color: '#F7F7F7', roughness: 0.6 }),
  AwningBlue: new THREE.MeshStandardMaterial({ color: '#6D9BB3', roughness: 0.6 }),
  AwningPink: new THREE.MeshStandardMaterial({ color: '#E9D2C6', roughness: 0.6 }),
  AwningTerracotta: new THREE.MeshStandardMaterial({ color: '#C7785A', roughness: 0.6 }),
  AwningMustard: new THREE.MeshStandardMaterial({ color: '#D7A94F', roughness: 0.6 }),

  // Wood
  WoodDark: new THREE.MeshStandardMaterial({ color: '#8A5F3D', roughness: 0.7 }),
  FenceWood: new THREE.MeshStandardMaterial({ color: '#E8D5B8', roughness: 0.7 }),

  // Music/Entertainment
  MusicBlack: new THREE.MeshStandardMaterial({ color: '#1F1F1F', roughness: 0.55 }),

  // Neon (simplified - no heavy emissive)
  NeonPink: new THREE.MeshStandardMaterial({ color: '#ff2a6d', emissive: '#ff2a6d', emissiveIntensity: 0.8 }),
  NeonBlue: new THREE.MeshStandardMaterial({ color: '#05d9e8', emissive: '#05d9e8', emissiveIntensity: 0.8 }),
  NeonPurple: new THREE.MeshStandardMaterial({ color: '#d500f9', emissive: '#d500f9', emissiveIntensity: 0.8 }),

  // Windows
  WindowGlow: new THREE.MeshStandardMaterial({ color: '#FFF8DC', emissive: '#FFF8DC', emissiveIntensity: 0.5 }),

  // Flowers
  FlowerPink: new THREE.MeshStandardMaterial({ color: '#ff88b8', roughness: 0.7 }),
  FlowerYellow: new THREE.MeshStandardMaterial({ color: '#ffd850', roughness: 0.7 }),
  FlowerBlue: new THREE.MeshStandardMaterial({ color: '#68b8ff', roughness: 0.7 }),
  FlowerPurple: new THREE.MeshStandardMaterial({ color: '#c888ff', roughness: 0.7 }),
  FlowerRed: new THREE.MeshStandardMaterial({ color: '#ff5858', roughness: 0.7 }),
  FlowerOrange: new THREE.MeshStandardMaterial({ color: '#ffaa58', roughness: 0.7 }),

  // Nature
  CloudWhite: new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, roughness: 0.9 }),
  LeafGreen: new THREE.MeshStandardMaterial({ color: '#78d870', roughness: 0.7 }),
  LeafAutumn: new THREE.MeshStandardMaterial({ color: '#ff9858', roughness: 0.7 }),
  LeafSpring: new THREE.MeshStandardMaterial({ color: '#a8ff88', roughness: 0.7 }),

  // Signage
  SignageBase: new THREE.MeshStandardMaterial({ color: '#2F3033', roughness: 0.2 }),
  SignageAccent: new THREE.MeshStandardMaterial({ color: '#F2C94C', roughness: 0.35 }),

  // Additional materials used by Buildings.tsx
  LightWood: new THREE.MeshStandardMaterial({ color: '#D4B896', roughness: 0.7 }),
  NaturalGreen: new THREE.MeshStandardMaterial({ color: '#6B8E4E', roughness: 0.7 }),
  WallStucco: new THREE.MeshStandardMaterial({ color: '#F5EFE0', roughness: 0.8 }),
  Mustard: new THREE.MeshStandardMaterial({ color: '#C9A227', roughness: 0.6 }),
  SoftBrick: new THREE.MeshStandardMaterial({ color: '#B87D5B', roughness: 0.7 }),
  Paver: new THREE.MeshStandardMaterial({ color: '#A89078', roughness: 0.8 }),
  TemperedGlass: new THREE.MeshStandardMaterial({ color: '#C8E0E8', transparent: true, opacity: 0.6, roughness: 0.1 }),
};
