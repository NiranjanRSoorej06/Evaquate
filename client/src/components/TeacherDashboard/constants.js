import { Flame, ShieldAlert, Waves, Mountain } from 'lucide-react';

export const disasterOptions = [
  { id: 'fire', label: 'Fire Safety', description: 'Fire escape and extinguisher basics', icon: Flame, color: '#ef4444' },
  { id: 'earthquake', label: 'Earthquake Drill', description: 'Drop, cover and hold procedures', icon: ShieldAlert, color: '#f97316' },
  { id: 'flood', label: 'Flood Survival', description: 'Safe routes and high-ground planning', icon: Waves, color: '#0ea5e9' },
  { id: 'landslide', label: 'Landslide Safety', description: 'Evacuation and hazard awareness', icon: Mountain, color: '#8b5cf6' }
];

export const answerLabel = (index) => ['A', 'B', 'C', 'D'][index] || '?';
