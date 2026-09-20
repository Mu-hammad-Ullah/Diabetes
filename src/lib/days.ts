import type { DictKey } from '@/lib/i18n';

export const DAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'] as const;
export const DAY_KEYS: Record<string, DictKey> = {
  sat: 'daysSat', sun: 'daysSun', mon: 'daysMon', tue: 'daysTue', wed: 'daysWed', thu: 'daysThu', fri: 'daysFri',
};
export const SLOT_KEYS = { morning: 'slotMorning', afternoon: 'slotAfternoon', evening: 'slotEvening' } as const;
