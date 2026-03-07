// ============================================
// Kaiju Definitions
// Decision 34: 7 kaiju, teacher-triggered,
// pure spectacle, zero game penalty
// ============================================

export interface KaijuDefinition {
  id: string;
  name: string;
  emoji: string;
  animationStyle: string;
  description: string;
  durationMs: number;
  soundEffect: string;
  cssClass: string;
  colors: {
    primary: string;
    secondary: string;
    glow: string;
  };
}

export const KAIJU: KaijuDefinition[] = [
  {
    id: "kraken",
    name: "Kraken",
    emoji: "🐙",
    animationStyle: "Tentacles erupt from ocean/coastal tiles",
    description: "From the deep, massive tentacles burst through the waves — wrapping around anything in sight.",
    durationMs: 6000,
    soundEffect: "water_crash",
    cssClass: "kaiju-kraken",
    colors: { primary: "#1a4a6e", secondary: "#3dd6c8", glow: "#00ffcc" },
  },
  {
    id: "thunderbird",
    name: "Thunderbird",
    emoji: "⚡",
    animationStyle: "Dive-bomb from sky, lightning strikes",
    description: "A shadow blocks the sun. Thunder CRACKS. The Thunderbird descends with fury.",
    durationMs: 5000,
    soundEffect: "thunder_crack",
    cssClass: "kaiju-thunderbird",
    colors: { primary: "#4a0080", secondary: "#ffd700", glow: "#ffff00" },
  },
  {
    id: "rexar",
    name: "Rexar",
    emoji: "🦖",
    animationStyle: "Stomps in from map edge, classic kaiju walk",
    description: "The ground shakes. Trees snap. REXAR emerges — towering, unstoppable, magnificent.",
    durationMs: 7000,
    soundEffect: "earth_stomp",
    cssClass: "kaiju-rexar",
    colors: { primary: "#2d5016", secondary: "#ff4444", glow: "#ff6600" },
  },
  {
    id: "kodiak",
    name: "Kodiak",
    emoji: "🐻",
    animationStyle: "Lumbers from the north, giant polar bear",
    description: "From the frozen north, KODIAK lumbers south — a mountain of fur and teeth. Alaska's champion.",
    durationMs: 6000,
    soundEffect: "bear_roar",
    cssClass: "kaiju-kodiak",
    colors: { primary: "#e8e8e8", secondary: "#87ceeb", glow: "#b0e0ff" },
  },
  {
    id: "chimera",
    name: "Chimera",
    emoji: "🔥",
    animationStyle: "Three-headed lion/goat/serpent rage",
    description: "Lion. Goat. Serpent. Three heads, one nightmare. The CHIMERA of myth is loose.",
    durationMs: 7000,
    soundEffect: "fire_breath",
    cssClass: "kaiju-chimera",
    colors: { primary: "#8b0000", secondary: "#ff8c00", glow: "#ff4500" },
  },
  {
    id: "cyclops",
    name: "Cyclops",
    emoji: "👁️",
    animationStyle: "Single eye glow, boulder-throw",
    description: "One eye. One terrible, glowing eye. The CYCLOPS hurls boulders like pebbles.",
    durationMs: 6000,
    soundEffect: "boulder_impact",
    cssClass: "kaiju-cyclops",
    colors: { primary: "#5c4033", secondary: "#ff0000", glow: "#ff3333" },
  },
  {
    id: "zorg9",
    name: "ZORG-9",
    emoji: "🛸",
    animationStyle: "Flying saucer descends, abduction beam, warps out",
    description: "A disc of light descends. Green beam. Someone screams. ZORG-9 takes what it wants — and warps away.",
    durationMs: 8000,
    soundEffect: "ufo_beam",
    cssClass: "kaiju-zorg9",
    colors: { primary: "#1a1a2e", secondary: "#00ff00", glow: "#00ff88" },
  },
];

export function getKaiju(id: string): KaijuDefinition | undefined {
  return KAIJU.find((k) => k.id === id);
}

export function getAllKaijuIds(): string[] {
  return KAIJU.map((k) => k.id);
}
