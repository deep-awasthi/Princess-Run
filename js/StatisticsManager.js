class StatisticsManager {
  static recordGame(score, distance, coins, survivalTime, statsDelta = {}) {
    const data = StorageManager.load();
    const stats = data.statistics;

    // Increment overall statistics
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    
    // Average score recalculation
    const totalScoreSoFar = (stats.averageScore || 0) * (stats.gamesPlayed - 1);
    stats.averageScore = Math.round((totalScoreSoFar + score) / stats.gamesPlayed);

    // High scores
    if (score > (stats.highestScore || 0)) {
      stats.highestScore = Math.floor(score);
    }
    if (distance > (stats.highestDistance || 0)) {
      stats.highestDistance = Math.floor(distance);
    }
    if (survivalTime > (stats.longestSurvival || 0)) {
      stats.longestSurvival = Math.floor(survivalTime);
    }

    // Totals
    stats.totalDistance = (stats.totalDistance || 0) + Math.floor(distance);
    stats.totalCoins = (stats.totalCoins || 0) + Math.floor(coins);

    // Delta counts from this game run
    stats.totalHeartsLost = (stats.totalHeartsLost || 0) + (statsDelta.heartsLost || 0);
    stats.totalPoopsSteppedOn = (stats.totalPoopsSteppedOn || 0) + (statsDelta.poopsSteppedOn || 0);
    stats.totalPowerupsCollected = (stats.totalPowerupsCollected || 0) + (statsDelta.powerupsCollected || 0);
    stats.totalCrownsCollected = (stats.totalCrownsCollected || 0) + (statsDelta.crownsCollected || 0);
    stats.totalGemsCollected = (stats.totalGemsCollected || 0) + (statsDelta.gemsCollected || 0);

    StorageManager.save(data);
  }

  static getStats() {
    return StorageManager.load().statistics;
  }

  static reset() {
    StorageManager.resetStatistics();
  }
}
window.StatisticsManager = StatisticsManager;
