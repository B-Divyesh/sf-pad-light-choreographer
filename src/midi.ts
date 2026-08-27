import type { Lane, Settings } from './model';

export class MidiController {
  access?: MIDIAccess;
  onHit?: (lane: Lane, velocity: number) => void;
  onUnknown?: (note: number) => void;
  onPortsChanged?: () => void;
  settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  get supported(): boolean {
    return typeof navigator.requestMIDIAccess === 'function';
  }

  async connect(): Promise<void> {
    if (!navigator.requestMIDIAccess) throw new Error('Web MIDI is not available in this browser.');
    this.access = await navigator.requestMIDIAccess({ sysex: false });
    this.access.onstatechange = () => this.onPortsChanged?.();
    this.bindInput();
  }

  inputs(): MIDIInput[] {
    return this.access ? Array.from(this.access.inputs.values()) : [];
  }

  outputs(): MIDIOutput[] {
    return this.access ? Array.from(this.access.outputs.values()) : [];
  }

  bindInput(): void {
    this.inputs().forEach((input) => { input.onmidimessage = null; });
    const input = this.inputs().find((port) => port.id === this.settings.inputId) ?? this.inputs()[0];
    if (!input) return;
    this.settings.inputId = input.id;
    input.onmidimessage = (event) => {
      const [status, note, velocity] = event.data ?? [];
      if (status === undefined || note === undefined || velocity === undefined) return;
      const command = status & 0xf0;
      if (command !== 0x90 || velocity === 0) return;
      const lane = this.settings.inputNotes.indexOf(note);
      if (lane >= 0) this.onHit?.(lane as Lane, velocity);
      else this.onUnknown?.(note);
    };
  }

  light(lane: Lane, on: boolean): void {
    if (!this.settings.lightsEnabled) return;
    const output = this.outputs().find((port) => port.id === this.settings.outputId);
    if (!output) return;
    const channel = Math.max(0, Math.min(15, this.settings.midiChannel - 1));
    output.send([on ? 0x90 + channel : 0x80 + channel, this.settings.outputNotes[lane], on ? 96 : 0]);
  }

  allOff(): void {
    ([0, 1, 2, 3] as Lane[]).forEach((lane) => this.light(lane, false));
  }
}
