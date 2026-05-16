export const calculateSleepHealthScore = (
  duration: number,
  bedTime: Date,
  wakeUpTime: Date,
  sleepType: 'night' | 'nap' = 'night',
  sleepQualityScore?: number,
): number => {
  const qualityScore =
    typeof sleepQualityScore === 'number'
      ? Math.min(10, Math.max(1, sleepQualityScore))
      : undefined;

  if (sleepType === 'nap') {
    let objectiveNapScore = 0;
    if (duration > 0 && duration <= 0.6) {
      objectiveNapScore += 100;
    } else if (duration > 0.6 && duration <= 1) {
      objectiveNapScore += 80;
    } else if (duration > 1 && duration <= 1.5) {
      objectiveNapScore += 50;
    } else {
      objectiveNapScore += 20;
    }

    const bedHour = bedTime.getHours();
    if (bedHour >= 16) {
      objectiveNapScore -= 20;
    }

    objectiveNapScore = Math.min(100, Math.max(0, objectiveNapScore));

    if (typeof qualityScore !== 'number') {
      return objectiveNapScore;
    }

    const subjective = qualityScore * 10;
    const blended = objectiveNapScore * 0.7 + subjective * 0.3;
    return Math.round(Math.min(100, Math.max(0, blended)) * 10) / 10;
  }

  let objectiveNightScore = 0;
  if (duration >= 7 && duration <= 9) {
    objectiveNightScore += 40;
  } else if (duration >= 6 && duration < 7) {
    objectiveNightScore += 30;
  } else if (duration > 9 && duration <= 10) {
    objectiveNightScore += 30;
  } else if (duration >= 5 && duration < 6) {
    objectiveNightScore += 20;
  } else if (duration > 10 && duration <= 11) {
    objectiveNightScore += 15;
  } else {
    objectiveNightScore += 0;
  }

  const bedHour = bedTime.getHours();
  if (bedHour >= 21 && bedHour <= 23) {
    objectiveNightScore += 30;
  } else if (bedHour === 20 || bedHour === 0) {
    objectiveNightScore += 20;
  } else if (bedHour >= 1 && bedHour <= 2) {
    objectiveNightScore += 10;
  } else {
    objectiveNightScore += 0;
  }

  const wakeHour = wakeUpTime.getHours();
  if (wakeHour >= 5 && wakeHour <= 7) {
    objectiveNightScore += 30;
  } else if (wakeHour === 8) {
    objectiveNightScore += 20;
  } else if (wakeHour >= 9 && wakeHour <= 10) {
    objectiveNightScore += 10;
  } else {
    objectiveNightScore += 0;
  }

  objectiveNightScore = Math.min(100, Math.max(0, objectiveNightScore));

  if (typeof qualityScore !== 'number') {
    return objectiveNightScore;
  }

  const subjective = qualityScore * 10;
  const blended = objectiveNightScore * 0.7 + subjective * 0.3;
  return Math.round(Math.min(100, Math.max(0, blended)) * 10) / 10;
};
