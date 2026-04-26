/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Meal {
  id: string;
  name: string;
  protein: number;
  completed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface DailyStats {
  date: string; // ISO format YYYY-MM-DD
  meals: Meal[];
  waterGlasses: boolean[]; // Array of 8 booleans
  proteinGoal: number;
  streak: number;
  isDayCompleted: boolean;
}

export interface HistoryEntry {
  date: string;
  proteinCompleted: number;
  proteinTotal: number;
  waterCount: number;
  streak: number;
}

export interface Reminder {
  id: string;
  type: 'proteina' | 'agua';
  time: string;
  enabled: boolean;
}

export type Tab = 'inicio' | 'proteina' | 'agua' | 'logros' | 'historial' | 'ajustes';
