import { Vector3 } from 'three';

export enum TreeState {
  CHAOS = 'CHAOS',
  FORMED = 'FORMED'
}

export enum GestureType {
  NONE = 'NONE',
  OPEN_PALM = 'OPEN_PALM',
  CLOSED_FIST = 'CLOSED_FIST'
}

// Colors
export const COLORS = {
  EMERALD_DARK: '#002814',
  EMERALD: '#004d25',
  EMERALD_LIGHT: '#007a3d',
  GOLD: '#FFD700', // Metallic Gold
  RICH_RED: '#8a0022', // Deep Burgundy/Red
  ROYAL_BLUE: '#002266', // Deep Blue
  SILVER: '#C0C0C0',
  SNOW_WHITE: '#F5F5F5',
  GLOW: '#fff2cc',
  WARM_LIGHT: '#ffaa55',
  WOOD: '#5d4037', // Dark wood for pinecones
  BRONZE: '#b08d55' // Aged gold/bronze for bells
};