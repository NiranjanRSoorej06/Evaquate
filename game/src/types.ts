/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoomType =
  | 'classroom'
  | 'laboratory'
  | 'library'
  | 'office'
  | 'corridor'
  | 'staircase'
  | 'emergency_exit'
  | 'assembly_area'
  | 'playground'
  | 'restroom'
  | 'elevator'
  | 'utility';

export interface Door {
  id: string;
  x: number; // percentage coordinate 0-100 within floor or relative to room
  y: number;
  width: number;
  height: number;
  isOpen: boolean;
  leadsTo?: string; // Room ID
  isBlocked?: boolean;
}

export interface Window {
  id: string;
  x: number;
  y: number;
  width: number;
}

export interface Furniture {
  id: string;
  name: string;
  type: 'desk' | 'table' | 'shelf' | 'cabinet' | 'equipment';
  x: number;
  y: number;
  width: number;
  height: number;
  canShelterUnder: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  x: number; // x coordinate (0 to 100)
  y: number; // y coordinate (0 to 100)
  width: number; // width as % of layout
  height: number; // height as % of layout
  floor: number;
  doors: Door[];
  windows: Window[];
  furniture: Furniture[];
  color?: string;
}

export type DisasterType =
  | 'earthquake'
  | 'fire'
  | 'flood'
  | 'cyclone'
  | 'chemical_leak'
  | 'gas_leak';

export interface Hazard {
  id: string;
  type: 'fire' | 'smoke' | 'debris' | 'water' | 'electrical' | 'chemical_gas' | 'blocked_corridor';
  x: number;
  y: number;
  floor: number;
  radius: number;
  intensity: number; // 0 to 1
  message?: string;
}

export interface SchoolLayout {
  schoolName: string;
  floorsCount: number;
  rooms: Room[];
  assemblyArea: {
    x: number;
    y: number;
    radius: number;
    name: string;
  };
}

export interface Player {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'principal' | 'security' | 'first_aid' | 'response_team';
  x: number;
  y: number;
  floor: number;
  health: number; // 0 - 100
  oxygen: number; // 0 - 100
  isDucked: boolean; // Cover under desk
  hasGasMask: boolean;
  hasExtinguisher: boolean;
  hasFirstAidKit: boolean;
  isEvacuated: boolean;
  score: number;
  xp: number;
  statusLogs: string[];
}

export interface NPC {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'staff';
  x: number;
  y: number;
  floor: number;
  health: number;
  isInjured: boolean;
  isSaved: boolean;
  classroomID: string;
}

export interface ActionFeedback {
  timestamp: string;
  action: string;
  scoreChange: number;
  isCorrect: boolean;
  explanation: string;
}

export interface DrillResult {
  id: string;
  studentName: string;
  date: string;
  disasterType: DisasterType;
  timeTaken: number; // in seconds
  score: number;
  maxScore: number;
  healthRemaining: number;
  isSuccessful: boolean;
  actions: ActionFeedback[];
  feedbackSummary: string;
  badgeEarned?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  class: string;
  score: number;
  xp: number;
  drillsCompleted: number;
  isUser?: boolean;
}
