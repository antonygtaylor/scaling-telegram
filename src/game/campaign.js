/**
 * Theaters of War definitions, themes, and briefing lore.
 */
export const THEATERS = [
  {
    id: 1,
    name: 'Ashen Dunes',
    sectors: [1, 20],
    theme: {
      skyTop: '#1a1008',
      skyBottom: '#4a2c11',
      bgFar: '#2b1a0d',
      bgMid: '#3d2513',
      bgNear: '#52331a',
      bgSilhouette: '#1d1208',
      terrainTop: '#d4a359',
      terrainMid: '#b07f38',
      terrainBase: '#6b491b',
      terrainEdge: '#f5cc84',
      tankPlayer: '#4caf50',
      tankEnemy: '#e53935'
    },
    briefings: [
      "Welcome to the desolate Ashen Dunes. Sector 1 is defended by lone enemy patrols testing our frontline resolve. Calibrate your cannon and obliterate all hostiles.",
      "Scouts report heavy sandstorms ahead in Sector 10. High winds will displace mortar trajectories. Gauge wind gauges carefully before committing fire.",
      "Nearing the edge of Ashen Dunes in Sector 20. Hostile commanders are digging into deep trenches. Precision artillery hits are required."
    ]
  },
  {
    id: 2,
    name: 'Frostbite Pass',
    sectors: [21, 40],
    theme: {
      skyTop: '#0b192c',
      skyBottom: '#1e3e62',
      bgFar: '#122338',
      bgMid: '#1b365d',
      bgNear: '#284b7a',
      bgSilhouette: '#081220',
      terrainTop: '#e0f7fa',
      terrainMid: '#80deea',
      terrainBase: '#006064',
      terrainEdge: '#ffffff',
      tankPlayer: '#66bb6a',
      tankEnemy: '#ef5350'
    },
    briefings: [
      "Entering Frostbite Pass at Sector 21. Ice-slicked mountain slopes offer high ground advantages. Occupy elevated vantage points.",
      "Veteran enemy battlegroups are lurking in Sector 30. Expect calculated retaliatory counter-battery fire.",
      "Sector 40 guards the gateway to the metropolis. High-altitude mountain passes feature narrow cliff edges—use terrain destruction to drop hostiles off abysses."
    ]
  },
  {
    id: 3,
    name: 'The Iron Metropolis',
    sectors: [41, 60],
    theme: {
      skyTop: '#181818',
      skyBottom: '#332a2a',
      bgFar: '#221f1f',
      bgMid: '#362f2f',
      bgNear: '#4a4040',
      bgSilhouette: '#111010',
      terrainTop: '#78909c',
      terrainMid: '#455a64',
      terrainBase: '#263238',
      terrainEdge: '#cfd8dc',
      tankPlayer: '#81c784',
      tankEnemy: '#e57373'
    },
    briefings: [
      "Sector 41 places us amidst the smoldering industrial ruins of The Iron Metropolis. Steel structures cover enemy positions.",
      "Sector 50 features high density enemy armored batteries. Veterans focus on targets with depleted armor—protect your flanks.",
      "Metropolitan heartland at Sector 60. Dense urban terrain creates steep choke points. Clear the area at all costs."
    ]
  },
  {
    id: 4,
    name: 'Obsidian Ravines',
    sectors: [61, 80],
    theme: {
      skyTop: '#1b0000',
      skyBottom: '#3e1111',
      bgFar: '#2d0a0a',
      bgMid: '#421212',
      bgNear: '#581919',
      bgSilhouette: '#120303',
      terrainTop: '#4e342e',
      terrainMid: '#3e2723',
      terrainBase: '#1b0000',
      terrainEdge: '#8d6e63',
      tankPlayer: '#a5d6a7',
      tankEnemy: '#ff8a80'
    },
    briefings: [
      "The volatile volcanic terrain of Obsidian Ravines begins at Sector 61. Commander AI units actively collapse cliff edges beneath you.",
      "Sector 70 brings extreme crosswinds and deep basalt canyons. Precision indirect mortar lobbing is paramount.",
      "Ravine abyss ahead in Sector 80. Enemy commanders will deliberately carve craters beneath your tracks to cause instant vertical fall eliminations."
    ]
  },
  {
    id: 5,
    name: 'The Rust Citadel',
    sectors: [81, 100],
    theme: {
      skyTop: '#110c00',
      skyBottom: '#3a2e00',
      bgFar: '#2a2200',
      bgMid: '#3f3300',
      bgNear: '#544400',
      bgSilhouette: '#0d0a00',
      terrainTop: '#ffb300',
      terrainMid: '#ff8f00',
      terrainBase: '#ff6f00',
      terrainEdge: '#ffe082',
      tankPlayer: '#c8e6c9',
      tankEnemy: '#ff1744'
    },
    briefings: [
      "Sector 81: Welcome to the primary stronghold of the enemy forces, The Rust Citadel. Maximum defensive opposition expected.",
      "Sector 90: Sector match against 6 active Commander AI artillery batteries. Multi-turn trajectory adjustments required to survive.",
      "Sector 100: The Final Confrontation. 7 Elite Commander competitors stand between us and continental liberation. Fire for effect!"
    ]
  }
];

export class LevelGenerator {
  /**
   * Get deterministic parameters for level X (1..100)
   */
  static getLevelConfig(levelNumber) {
    const levelId = Math.max(1, Math.min(100, Math.floor(levelNumber)));
    // Deterministic seed formula specified in requirements
    const seed = levelId * 99991;

    // Determine Theater
    let theater = THEATERS[0];
    for (const t of THEATERS) {
      if (levelId >= t.sectors[0] && levelId <= t.sectors[1]) {
        theater = t;
        break;
      }
    }

    // AI Scaling Architecture:
    // Enemy count scales from 2 enemy tanks at L1 up to 7 active AI competitors at higher levels
    const enemyCount = Math.min(7, Math.max(2, Math.floor(2 + (levelId - 1) * (5 / 99))));

    // AI Intelligence Tier
    let aiTier = 'Rookie AI';
    let aiVariance = 0.15; // shot inaccuracy error margin
    if (levelId > 30 && levelId <= 70) {
      aiTier = 'Veteran AI';
      aiVariance = 0.06;
    } else if (levelId > 70) {
      aiTier = 'Commander AI';
      aiVariance = 0.01;
    }

    // Narrative briefing
    const briefingIdx = Math.floor((levelId - theater.sectors[0]) / ((theater.sectors[1] - theater.sectors[0] + 1) / theater.briefings.length));
    const briefingText = theater.briefings[Math.min(theater.briefings.length - 1, briefingIdx)];

    return {
      levelId,
      seed,
      theater,
      enemyCount,
      aiTier,
      aiVariance,
      briefingText
    };
  }
}
