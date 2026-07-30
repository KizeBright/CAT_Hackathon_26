import { machines } from '../data/mockData';
import type { Machine } from '../types';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
  getMachines: async (): Promise<Machine[]> => { await delay(600); return machines; },
  getMachineById: async (id: string): Promise<Machine | undefined> => { await delay(400); return machines.find(m => m.id === id); },
};
