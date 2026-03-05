export const BUDGET_HOURS = 40;
export const BUDGET_RESET_DAY = 7;
export const TIME_CATEGORIES = ['research', 'strategy', 'meeting', 'admin', 'content', 'building'] as const;
export type TimeCategory = typeof TIME_CATEGORIES[number];
export const PORT = 3040;
