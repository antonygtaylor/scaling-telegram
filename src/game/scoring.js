/**
 * Turn Manager & Scoring Engine
 */
export class ScoringEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalShots = 0;
    this.directHits = 0;
    this.splashHits = 0;
    this.totalHits = 0;
    this.environmentalKills = 0;
    this.damageDealt = 0;
    this.score = 0;
  }

  recordShot() {
    this.totalShots++;
  }

  recordHit(isDirect, damage, distance) {
    this.totalHits++;
    this.damageDealt += damage;

    if (isDirect) {
      this.directHits++;
      // Direct Hit: +500 PTS + bonus proportional to damage
      this.score += 500 + Math.round(damage * 5);
    } else {
      this.splashHits++;
      // Splash Hit: +100 to +300 PTS scaled by proximity
      const proximityBonus = Math.max(100, Math.round(300 - distance * 5));
      this.score += proximityBonus + Math.round(damage * 3);
    }
  }

  recordEnvironmentalKill() {
    this.environmentalKills++;
    // Environmental Elimination: +1,000 PTS
    this.score += 1000;
  }

  getAccuracy() {
    if (this.totalShots === 0) return 0;
    return Math.min(100, Math.round((this.totalHits / this.totalShots) * 100));
  }

  getGrade() {
    const accuracy = this.getAccuracy();
    if (accuracy >= 85) return 'S';
    if (accuracy >= 70) return 'A';
    if (accuracy >= 50) return 'B';
    return 'C';
  }

  getSummary() {
    const accuracy = this.getAccuracy();
    const grade = this.getGrade();
    // End-of-level grade accuracy multiplier
    let gradeMultiplier = 1.0;
    if (grade === 'S') gradeMultiplier = 1.5;
    else if (grade === 'A') gradeMultiplier = 1.25;
    else if (grade === 'B') gradeMultiplier = 1.1;

    const finalScore = Math.round(this.score * gradeMultiplier);

    return {
      baseScore: this.score,
      finalScore,
      totalShots: this.totalShots,
      totalHits: this.totalHits,
      accuracy,
      grade,
      environmentalKills: this.environmentalKills,
      damageDealt: this.damageDealt
    };
  }
}
