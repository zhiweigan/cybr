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
 * @param {Session} [session] Only used in recursion. Consuming cose should not
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
 * Create a `FluidMessage` from a TracksObject
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
  for (let [trackName, track] of Object.entries(tracksObject)) {
    if (tab.reservedKeys.hasOwnProperty(trackName)) {
      continue;
    }

    if (!track.clips) {
      console.log(`skipping ${trackName}, because it has no .clips`);
      continue;
    }

    messages.push(fluid.audiotrack.select(trackName));
    for (let clip of track.clips) {
      let midiNotes = clip.notes.filter(event => typeof event.n === 'number');
      let samples   = clip.notes.filter(event => event.n && event.n.type === 'file');
      if (midiNotes.length) {
        messages.push(fluid.midiclip.create(`clip${i++}`, clip.startTime, clip.duration, midiNotes));
      }
      for (let sample of samples) {
        let startTime = (clip.startTime + sample.s);
        messages.push(
          fluid.audiotrack.insertWav(`s${i++}`, startTime, sample.n.path),
          fluid.audioclip.gain(midiVelocityToDbfs(sample.v, -10, 10)),
        )
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