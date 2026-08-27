export type Lane = 0 | 1 | 2 | 3;
export type Step = Lane | null;

export interface Routine {
  id: string;
  name: string;
  steps: Step[];
  bpm: number;
  updatedAt: number;
}

export interface Settings {
  inputId: string;
  outputId: string;
  midiChannel: number;
  inputNotes: [number, number, number, number];
  outputNotes: [number, number, number, number];
  lightsEnabled: boolean;
}

export const starterRoutine = (): Routine => ({
  id: crypto.randomUUID(),
  name: 'First four',
  steps: [0, 1, 2, 3, 0, 2, 1, 3],
  bpm: 92,
  updatedAt: Date.now(),
});

export const defaultSettings: Settings = {
  inputId: '',
  outputId: '',
  midiChannel: 1,
  inputNotes: [36, 37, 38, 39],
  outputNotes: [36, 37, 38, 39],
  lightsEnabled: false,
};

export function normalizeRoutine(value: unknown): Routine {
  if (!value || typeof value !== 'object') throw new Error('The file does not contain a routine.');
  const source = value as Partial<Routine>;
  if (typeof source.name !== 'string' || !source.name.trim() || source.name.length > 80) {
    throw new Error('The routine needs a name of 1–80 characters.');
  }
  if (!Array.isArray(source.steps) || source.steps.length < 1 || source.steps.length > 64) {
    throw new Error('The routine needs between 1 and 64 steps.');
  }
  const steps = source.steps.map((step) => {
    if (step === null) return null;
    if (Number.isInteger(step) && Number(step) >= 0 && Number(step) <= 3) return Number(step) as Lane;
    throw new Error('Each step must be a lane from 0–3 or a rest.');
  });
  const bpm = Number(source.bpm ?? 92);
  if (!Number.isFinite(bpm) || bpm < 40 || bpm > 240) throw new Error('Tempo must be from 40–240 BPM.');
  return {
    id: typeof source.id === 'string' && source.id ? source.id : crypto.randomUUID(),
    name: source.name.trim(),
    steps,
    bpm: Math.round(bpm),
    updatedAt: Date.now(),
  };
}

export function routineFile(routine: Routine): string {
  return JSON.stringify({ format: 'pad-light-routine', version: 1, ...routine }, null, 2);
}
