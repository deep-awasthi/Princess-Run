class StorageManager {
  static KEY = 'princessRunData';

  static getDefaultData() {
    return {
      lastFiveGames: [],
      topFiveScores: [],
      statistics: {
        gamesPlayed: 0,
        highestScore: 0,
        averageScore: 0,
        highestDistance: 0,
        longestSurvival: 0,
        totalDistance: 0,
        totalCoins: 0,
        totalHeartsLost: 0,
        totalPoopsSteppedOn: 0,
        totalPowerupsCollected: 0,
        totalCrownsCollected: 0,
        totalGemsCollected: 0
      },
      settings: {
        musicVolume: 50,
        sfxVolume: 80,
        theme: 'light',
        difficulty: 'normal',
        graphicsQuality: 'medium',
        reducedMotion: false,
        highContrast: false
      },
      achievements: [],
      unlockedThemes: ['light', 'night', 'candy', 'rainbow', 'retro']
    };
  }

  static load() {
    try {
      const dataStr = localStorage.getItem(this.KEY);
      if (!dataStr) {
        const defaultData = this.getDefaultData();
        this.save(defaultData);
        return defaultData;
      }
      const data = JSON.parse(dataStr);
      // Merge with default data structure to ensure new properties are not missing
      const defaultData = this.getDefaultData();
      
      // Deep merge basic settings/statistics
      const merged = {
        ...defaultData,
        ...data,
        statistics: { ...defaultData.statistics, ...data.statistics },
        settings: { ...defaultData.settings, ...data.settings },
        lastFiveGames: Array.isArray(data.lastFiveGames) ? data.lastFiveGames : [],
        topFiveScores: Array.isArray(data.topFiveScores) ? data.topFiveScores : [],
        achievements: Array.isArray(data.achievements) ? data.achievements : [],
        unlockedThemes: Array.isArray(data.unlockedThemes) ? data.unlockedThemes : defaultData.unlockedThemes
      };
      return merged;
    } catch (e) {
      console.error('Failed to load localStorage data, using defaults', e);
      return this.getDefaultData();
    }
  }

  static save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  static resetLeaderboard() {
    const data = this.load();
    data.lastFiveGames = [];
    data.topFiveScores = [];
    this.save(data);
  }

  static resetStatistics() {
    const data = this.load();
    data.statistics = this.getDefaultData().statistics;
    this.save(data);
  }
}
window.StorageManager = StorageManager;
