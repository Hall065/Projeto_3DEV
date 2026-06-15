import type { ConnectWeeklyPattern } from '../types/connect'

export function weeklyPatternsForShift(shift: string, subject: string): ConnectWeeklyPattern[] {
  switch (shift) {
    case 'manha':
      return [
        { day_of_week: 1, start_time: '08:00', end_time: '11:30', lessons_count: 4, subject },
        { day_of_week: 3, start_time: '08:00', end_time: '11:30', lessons_count: 4, subject },
      ]
    case 'tarde':
      return [
        { day_of_week: 2, start_time: '14:00', end_time: '17:30', lessons_count: 4, subject },
        { day_of_week: 4, start_time: '14:00', end_time: '17:30', lessons_count: 4, subject },
      ]
    default:
      return [
        { day_of_week: 2, start_time: '19:00', end_time: '22:30', lessons_count: 4, subject },
        { day_of_week: 4, start_time: '19:00', end_time: '22:30', lessons_count: 4, subject },
      ]
  }
}
