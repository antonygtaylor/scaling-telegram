/**
 * Tiered Competitor AI Controller
 * Tier 1: Rookie AI (Levels 1–30) - shot error variance, random target.
 * Tier 2: Veteran AI (Levels 31–70) - targets low HP opponents, moderate accuracy.
 * Tier 3: Commander AI (Levels 71–100) - high precision solver, targets terrain beneath opponents near abysses.
 */
export class AIController {
  static calculateTurn(aiTank, allTanks, terrain, levelConfig, worldWidth) {
    // Filter alive opponent tanks
    const opponents = allTanks.filter(t => t.id !== aiTank.id && t.isAlive);
    if (opponents.length === 0) {
      return { angle: 135, power: 50 };
    }

    let target = null;

    if (levelConfig.aiTier === 'Rookie AI') {
      // Targets at random
      const idx = Math.floor(Math.random() * opponents.length);
      target = opponents[idx];
    } else if (levelConfig.aiTier === 'Veteran AI') {
      // Targets lowest-HP opponent
      target = opponents.reduce((lowest, curr) => curr.hp < lowest.hp ? curr : lowest, opponents[0]);
    } else {
      // Commander AI: check if any opponent is near a steep abyss/chasm to force lethal fall
      let chasmTarget = null;
      for (const opp of opponents) {
        const oppGroundY = terrain.getHeightAt(opp.x);
        const leftH = terrain.getHeightAt(Math.max(0, opp.x - 40));
        const rightH = terrain.getHeightAt(Math.min(worldWidth - 1, opp.x + 40));

        // High cliff or steep drop nearby
        if (Math.abs(leftH - oppGroundY) > 60 || Math.abs(rightH - oppGroundY) > 60) {
          chasmTarget = opp;
          break;
        }
      }
      target = chasmTarget || opponents.reduce((lowest, curr) => curr.hp < lowest.hp ? curr : lowest, opponents[0]);
    }

    // Solve ballistic angle and power for target
    const dx = target.x - aiTank.x;
    const dy = target.y - aiTank.y;

    // Direct angle towards target
    let baseAngleDeg = 45;
    if (dx < 0) {
      baseAngleDeg = 135;
    }

    // Ballistic distance estimate
    const dist = Math.abs(dx);
    let estimatedPower = Math.min(100, Math.max(20, Math.sqrt(dist * 12)));

    // Apply AI variance/error based on intelligence tier
    const variance = levelConfig.aiVariance || 0.1;
    const errorFactor = 1 + (Math.random() - 0.5) * variance * 2;

    const finalPower = Math.min(100, Math.max(15, estimatedPower * errorFactor));
    const finalAngle = Math.min(175, Math.max(5, baseAngleDeg + (Math.random() - 0.5) * variance * 20));

    return {
      angle: Math.round(finalAngle),
      power: Math.round(finalPower)
    };
  }
}
