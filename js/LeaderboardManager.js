class LeaderboardManager {
  static submitScore(score, distance, coins, survivalTime) {
    const data = StorageManager.load();
    const date = new Date();
    
    // Format Date & Time
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const gameRecord = {
      score: Math.floor(score),
      distance: Math.floor(distance),
      coins: Math.floor(coins),
      survivalTime: Math.floor(survivalTime),
      date: dateStr,
      time: timeStr
    };

    // 1. UPDATE LAST FIVE GAMES (Stack: newest first, max 5)
    data.lastFiveGames.unshift(gameRecord);
    if (data.lastFiveGames.length > 5) {
      data.lastFiveGames = data.lastFiveGames.slice(0, 5);
    }

    // 2. UPDATE TOP FIVE SCORES (Sorted by highest score, max 5)
    let isNewHighScore = false;
    let rank = -1;

    data.topFiveScores.push(gameRecord);
    data.topFiveScores.sort((a, b) => b.score - a.score);

    // Find if the current record is in the top 5
    const topRankIndex = data.topFiveScores.findIndex(r => 
      r.score === gameRecord.score && 
      r.distance === gameRecord.distance && 
      r.date === gameRecord.date && 
      r.time === gameRecord.time
    );

    if (topRankIndex !== -1 && topRankIndex < 5) {
      isNewHighScore = true;
      rank = topRankIndex + 1; // 1-indexed
    }

    if (data.topFiveScores.length > 5) {
      data.topFiveScores = data.topFiveScores.slice(0, 5);
    }

    StorageManager.save(data);

    return {
      isNewHighScore,
      rank
    };
  }

  static getTopFive() {
    return StorageManager.load().topFiveScores;
  }

  static getLastFive() {
    return StorageManager.load().lastFiveGames;
  }

  static reset() {
    StorageManager.resetLeaderboard();
  }
}
window.LeaderboardManager = LeaderboardManager;
