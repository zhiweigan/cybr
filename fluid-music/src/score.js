const R     = require('ramda');
const tab   = require('./tab');
const fluid = require('./fluid/index')

const parseTab     = tab.parseTab;
const parseRhythm  = tab.parseRhythm;
const reservedKeys = tab.reservedKeys;

/**
 * score.parse is somewhat similar to tab.parse, except that it expects a
 * different input format, and outputs a `Session` instead of an array of notes.
 *
 * Typically called with two arguments (other args are for internal use only)
 * - A ScoreObject array
 * - A config object with (at minimum) a `.nLibrary` and `.r`hythm
 *
 * @param {ScoreObject|String} scoreObject The Score Object to parse
 * @param {Object} [config]
 * @param {number} [config.startTime=0]
 * @param {string} [config.rhythm] default rhythm string, which may be
 *    overridden by values in `scoreObject`. If not specified, `scoreObject` must have a
 *   `.r` property.
 * @param {string} [config.trackKey] name of the track being parsed
 * @param {string} [config.vPattern] optional velocity library
 * @param {NoteLibrary} [config.vLibrary]
 * @param {NoteLibrary} [config.nLibrary] (see tab.parseTab for details about
 *   `NoteLibrary`). If not specified, `scoreObject` must have a `.nLibrary` property.
 * @param {Session} [session] Only used in recursion. Consuming code should not
 *    supply this argument.
 * @returns {Session} representation of the score.
 */
function parse(scoreObject, config, session, tracks={}) {
  const isOutermost = (session === undefined);
  if (isOutermost) session = {};

  if (!config) config = {};
  else config = Object.assign({}, config); // Shallow copy should be ok

  if (scoreObject.hasOwnProperty('nLibrary')) config.nLibrary = scoreObject.nLibrary;
  if (scoreObject.hasOwnProperty('vLibrary')) config.vLibrary = scoreObject.vLibrary;
  if (scoreObject.hasOwnProperty('r'))        config.r = scoreObject.r;
  if (scoreObject.hasOwnProperty('v'))        config.v = scoreObject.v;
  // Note that we cannot specify a .startTime in a score like we can for rhythms
  if (typeof config.startTime !== 'number') config.startTime = 0;

  // Internally, there are three handlers for (1)arrays (2)strings (3)objects
  //
  // All three handlers must:
  // - return an object that has a .duration property. Duration are interperated
  //   differently for Arrays, Objects, and Strings found in the input object.
  //   - Array:  sum of the duration of the array's elements
  //   - Object: duration of the longest child
  //   - string: duration of the associated rhythm string
  //
  // The array and object handlers must:
  // - create an appropriate `config` object for each child
  // - call score.parse on each child
  //
  // The string handler must:
  // - create clips with a .startTime and .duration
  // - add those clips to the sessions[trackKey].clips array
  //
  // The object handler must:
  // - return a TracksObject representation of the ScoreObject input

  const returnValue = {
    startTime: config.startTime,
    duration: 0,
  };
  if (isOutermost) returnValue.tracks = tracks;

  if (Array.isArray(scoreObject)) {
    let arrayStartTime = config.startTime;
    returnValue.regions = [];
    for (let o of scoreObject) {
      config.startTime = arrayStartTime + returnValue.duration;
      let result = parse(o, config, session, tracks);
      returnValue.regions.push(result);
      returnValue.duration += result.duration;
    }
    return returnValue;
  } else if (typeof scoreObject === 'string') {
    // We have a string that can be parsed with parseTab
    if (config.r === undefined)
      throw new Error(`score.parse encountered a pattern (${scoreObject}), but could not find a rhythm`);
    if (config.nLibrary === undefined)
      throw new Error(`score.parse encountered a pattern (${scoreObject}), but could not find a nLibrary`);

    const duration = R.last(parseRhythm(config.r).totals);
    const result = parseTab(config.r, scoreObject, config.nLibrary, config.v, config.vLibrary);
    result.startTime = config.startTime;
    result.duration = duration;

    const trackKey = config.trackKey;
    if (!tracks[trackKey]) tracks[trackKey] = {clips:[]};
    tracks[trackKey].clips.push(result);

    return result;
  } else {
    // Assume we have a JavaScript Object
    for (let [key, val] of Object.entries(scoreObject)) {
      if (reservedKeys.hasOwnProperty(key) && key !== 'clips') continue;
      if (key !== 'clips') config.trackKey = key; // if key='clips' use parent key
      let result = parse(val, config, session, tracks);
      if (result.duration > returnValue.duration) returnValue.duration = result.duration;
      returnValue[config.trackKey] = result;
    }
    return returnValue;
  }
};

function midiVelocityToDbfs(v, min = -60, max = 6) {
  const range = max - min;
  return R.clamp(min, max, v / 127 * range + min);
}

/**
 * Create a `FluidMessage` from a `TracksObject`
 *
 * ```javascript
 * const session = fluid.score.parse(myScore, myConfig);
 * const message = fluid.score.tracksToFluidMessage(session.tracks);
 * const client = new fluid.Client();
 * client.send(message);
 * ```
 *
 * @param {TracksObject} tracksObject A tracks object generated by score.parse
 * @returns {FluidMessage}
 */
function tracksToFluidMessage(tracksObject) {
  const messages = [];
  let i = 0;

  /* // example tracks object
  const tracks = {
    bass: { clips: [ clip1, clip2... ] },
    kick: { clips: [ clip1, clip2... ] },
  };*/
  for (let [trackName, track] of Object.entries(tracksObject)) {
    if (tab.reservedKeys.hasOwnProperty(trackName)) {
      continue;
    }

    if (!track.clips || !track.clips.length) {
      console.log(`skipping ${trackName}, because it has no .clips`);
      continue;
    }

    messages.push(fluid.audiotrack.select(trackName));
    for (let clip of track.clips) {
      /* // example clip object
      const clip = {
        notes: [ note1, note2 ],
        duration: 4,
        startTime: 4,
      };
      */
      let midiNotes = clip.notes.filter(note => typeof note.n === 'number');
      let samples   = clip.notes.filter(note => note.e && note.e.type === 'file');

      // example midi notes
      // NOTE: velocities are optional
      // NOTE: velocity objects can specify .v (midi velocity) or dbfs gain
      // { s: 0.0, l: 0.25, n: 60 v: 70 };
      // { s: 0.5, l: 0.25, n: 60 v: { v: 70, dbfs: -12 } };
      if (midiNotes.length) {
        messages.push(fluid.midiclip.create(`clip${i++}`, clip.startTime, clip.duration, midiNotes));
      }

      // // example sample note
      // {
      //   s: 0.50, // start
      //   l: 0.25, // length
      //   e: { type: 'file', path: 'media/kick.wav' },
      //   d: { v: 70, dbfs: -10 }, // If .v is present here...
      //   v: 70,                   // ...it will also be here...
      //                            // (but vice versa is not guaranteed)
      // };
      for (let sample of samples) {
        let startTime = (clip.startTime + sample.s);

        let msg = [
          fluid.audiotrack.insertWav(`s${i++}`, startTime, sample.e.path),
          fluid.clip.length(sample.l)];

        // Try to get sample gain
        let gain = null;
        // If there is a dynamics object, look for a dbfs property
        if (sample.d && typeof(sample.d.dbfs) === 'number') gain = sample.d.dbfs;
        // Otherwise, look for a .v property, and use a hard-coded default
        // conversion from midi velocity to dbfs
        else if (typeof sample.v === 'number') gain = midiVelocityToDbfs(sample.v, -10, 10);
        // Iff gain was found add it to the result
        if (gain !== null) msg.push(fluid.audioclip.gain(gain));

        messages.push(msg);
      }
    }
  }

  return messages;
};

module.exports = {
  tracksToFluidMessage,
  midiVelocityToDbfs,
  parse,
}
