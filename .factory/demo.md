# Demo sandbox

- Demo URL: /demo
- Sample: “Pocket call and response” is a 12-step, 96 BPM four-lane response routine. “Offbeat turnaround” is a second 8-step, 108 BPM routine.
- What happens: the sample opens directly in the practice screen with pads, score, routine picker, and response controls already populated.
- Storage boundary: demo routines and settings use the IndexedDB database demo:pad-light-choreographer. Real routines and settings use pad-light-choreographer. Demo code never reads or writes the real database.
- Reset: **Reset demo** clears only the demo database and restores both shipped samples.
- Leave demo: **Start for real** switches to the real database. It keeps the sample data separate and leaves it behind.
- Offline: after the first visit, /demo and its app shell are precached. The offline claim test opens a new browser context, visits /demo, goes offline, reloads, and plays the first sample cue.
