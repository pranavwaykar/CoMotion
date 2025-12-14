import dayjs from 'dayjs';

export type CommutePeriod = 'morning' | 'evening';

export function isWithinRushHours(date: Date, period: CommutePeriod): boolean {
  const hour = dayjs(date).hour();
  if (period === 'morning') {
    // 07:00 - 11:00 inclusive start, exclusive end
    return hour >= 7 && hour < 11;
  }
  // evening: 16:00 - 21:00
  return hour >= 16 && hour < 21;
}

export function timeWindowsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}


