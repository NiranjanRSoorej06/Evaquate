import { Flame, ShieldAlert, Waves, Mountain } from 'lucide-react';

export const DISASTERS = [
  { id: 'fire', label: 'Fire Safety', icon: Flame, color: '#ef4444', desc: 'Master fire escapes and extinguisher PASS techniques.' },
  { id: 'earthquake', label: 'Earthquake Drill', icon: ShieldAlert, color: '#f97316', desc: 'Learn drop, cover, and hold procedures on campus.' },
  { id: 'flood', label: 'Flood Survival', icon: Waves, color: '#0ea5e9', desc: 'Find high ground and safety points during floods.' },
  { id: 'landslide', label: 'Landslide Safety', icon: Mountain, color: '#8b5cf6', desc: 'Evacuate slide zones and follow shelter paths.' }
];

export const getDisasterMeta = (disasterType) => DISASTERS.find(d => d.id === disasterType);
