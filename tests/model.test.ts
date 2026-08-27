import { describe, expect, it } from 'vitest';
import { normalizeRoutine, routineFile } from '../src/model';

describe('routine format', () => {
  it('normalizes a compact routine', () => {
    const routine = normalizeRoutine({ name: '  Turnaround  ', steps: [0, 1, null, 3], bpm: 110 });
    expect(routine.name).toBe('Turnaround');
    expect(routine.steps).toEqual([0, 1, null, 3]);
    expect(routine.bpm).toBe(110);
  });

  it('rejects unsafe or out-of-range imports', () => {
    expect(() => normalizeRoutine({ name: 'Nope', steps: [7], bpm: 100 })).toThrow(/lane/);
    expect(() => normalizeRoutine({ name: 'Nope', steps: [0], bpm: 999 })).toThrow(/Tempo/);
  });

  it('exports a versioned, portable file', () => {
    const routine = normalizeRoutine({ name: 'Pocket', steps: [3, 2, 1, 0], bpm: 88 });
    expect(JSON.parse(routineFile(routine))).toMatchObject({ format: 'pad-light-routine', version: 1, name: 'Pocket' });
  });
});
