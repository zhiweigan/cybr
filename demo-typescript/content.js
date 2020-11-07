const path   = require('path');
const fluid  = require('fluid-music');
const cybr   = fluid.cybr;
const drums  = require('@fluid-music/kit');
const chords = require('./chords');

const { podolskiSine } = require('./presets')
const { MidiChord, MidiNote } = require('fluid-music/built/fluid-techniques');

////////////////////////////////////////////////////////////////
// Configure some VSTs

// Synthesizers
const pwmSynth = new fluid.TyrellN6Vst2({ env1Attack: 2, env1Decay: 77, env1Sustain: 69 })
const bassSynth = podolskiSine()

// Reverb
const verbPlugin = new fluid.DragonflyRoom({ decaySeconds: 2.4, predelayMs: 49, dryLevelPercent: 0, earlyLevelPercent: 40, lateLevelPercent: 100 })

// TCompressor VST
const comp = new fluid.TCompressorVst2()
comp.parameters.thresholdDb = -8
comp.parameters.ratio = 2.5

const bassComp = new fluid.TCompressorVst2({
  attackMs: 12,
  releaseMs: 80,
  useSidechainTrigger: 1,
  thresholdDb: -11,
  ratio: 4,
})

const scComp = new fluid.RoughRider3Vst2({
  externalSidechainEnable: 1,
  sensitivityDb: -10,
  ratio: 7,
  makeupGainDb: 0,
  releaseMs: 310,
  attackMs: 10,
})

// TEqualiser VST
const eq = new fluid.TEqualizerVst2()
eq.setBand2(330, -3)

////////////////////////////////////////////////////////////////
// Create score events (automation/midi/samples/etc)

const automationLibrary = {
  a: new fluid.techniques.TrackAuto({ paramKey: 'pan', value: -.5, curve: -0.5 }),
  b: new fluid.techniques.TrackAuto({ paramKey: 'pan', value:  .5 }),
  c: new fluid.techniques.TrackAuto({ paramKey: 'gain', value: -6, curve: 0.8 }),
  d: new fluid.techniques.TrackAuto({ paramKey: 'gain', value: -32.9 }),
  e: new fluid.techniques.TrackAuto({ paramKey: 'width', value: 0 }),
  f: new fluid.techniques.TrackAuto({ paramKey: 'width', value: 1 }),

  u: fluid.PodolskiVst2.makeAutomation.vcf0Cutoff(0.5),
  v: fluid.DragonflyRoom.makeAutomation.sizeMeters(9),
  w: fluid.DragonflyRoom.makeAutomation.sizeMeters(30),
}

const chordLibrary = fluid.tLibrary.fromArray(chords.map(chord => new fluid.techniques.MidiChord(chord)))
const bassLibrary = {}
Object.entries(chordLibrary).forEach(([k, v]) => {
  if (v instanceof MidiChord) {
    const note = v.notes.sort((a, b) => a - b)[0] - 36
    bassLibrary[k] = new MidiNote({ note })
  }
})

const dLibrary = {
  p: { dbfs: -6, intensity: 1/2 },
  m: { dbfs: -2.6, intensity: 3/4 },
  f: { dbfs: 0, intensity: 1.0 },
};

let session = new fluid.FluidSession({
  bpm: 96,
  r: '1 + 2 + 3 + 4 + ',
  // default for kick and snare
  tLibrary: drums.tLibrary,
  dLibrary,
}, [
  { name: 'mute', gain: -Infinity, children: [
    { name: 'skik' },
  ]},
  { name: 'drums', gain: -6, children: [
    { name: 'kick', d: '.   . mf      ', gain: -6, plugins: [comp, eq] },
    { name: 'snare',d: 'm   f   m   f ' },
    { name: 'tamb', pan: .25 },
    { name: 'sub', tLibrary: bassLibrary, plugins: [bassSynth, bassComp.sidechainWith('skik')] },
  ]},
  { name: 'chrd', gain: -10, tLibrary: chordLibrary, pan: -.25, plugins: [pwmSynth, scComp.sidechainWith('skik')] },
  { name: 'revb', plugins: [verbPlugin], tLibrary: automationLibrary },

])

session.insertScore({
  skik: ['d---d---d---d---', 'd---d---d---d---'],
  kick: ['.   . dd-dD--D--', 'd-- d-- d-- d-- '],
  snare:['r---s       s   ', '              '],
  tamb: ['t t t t t t t t ', {r: '1....234..', tamb: 'Ttttt..ttt', d: 'p'} ],
  sub:   '        b-      ',
  chrd:  'a-  .  ab---    ',
  //     '1 + 2 + 3 + 4 + ',
  revb:  'e       f       ',
});

const client = new cybr.Client()
async function run() {
  await client.connect(true)
  await session.saveAsReaperFile('demo-typescript', client)
  await session.saveAsTracktionFile('demo-typescript', client)
}

run()
  .catch(e => { throw e })
  .finally(() => { client.close() })
