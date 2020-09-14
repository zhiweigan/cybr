import { FluidPlugin } from './plugin';
import { FluidTrack } from './FluidTrack';
import { vst2ToReaperObject } from './vst2ToReaperObject';

import * as cybr from './cybr/index';
import FluidIpcClient = require('./cybr/IpcClient');

const tab  = require('./tab');
const rppp = require('rppp')


// Reaper appears to store gain as a simple numeric multiplier. I am choosing a
// max value of 12 db. Remember that this is equivalent to voltage gain, so we
// use 20 for the denominator in the equation below. This means that 6.02 db of
// gain is approximately equal to a gain factor of 2. Remember Power=Voltage^2
// which is how the 20 ends up in the db equation instead of 10.
const db2Gain = (db) => Math.pow(10, Math.min(db, 12) / 20);

/**
 * Create a `ReaperProject` from a `TracksObject`
 *
 * ```javascript
 * const session = fluid.score.parse(myScore, myConfig);
 * const project = fluid.score.tracksToReaperProject(session.tracks, bpm);
 * ```
 *
 * @param {TracksObject} tracksObject A tracks object generated by score.parse
 * @returns {ReaperProject}
 */
async function tracksToReaperProject(tracksObject : FluidTrack[], bpm : number, client: FluidIpcClient) {
  if (!bpm) throw new TypeError('tracksToReaperProject requires a bpm parameter')

  await client.send(cybr.global.activate('reaper-helper.tracktionedit', true))

  const reaperProject = new rppp.objects.ReaperProject();
  reaperProject.getOrCreateStructByToken('TEMPO').params = [bpm, 4, 4];

  // // example tracks object
  // const tracks = [
  //   { name: 'bass', clips: [ clip1, clip2... ] },
  //   { name: 'kick', clips: [ clip1, clip2... ] },
  // ];
  for (const track of tracksObject) {
    if (tab.reservedKeys.hasOwnProperty(track.name)) {
      continue;
    }

    const newTrack = new rppp.objects.ReaperTrack();
    newTrack.getOrCreateStructByToken('NAME').params[0] = track.name;
    reaperProject.addTrack(newTrack);

    track.clips.forEach((clip, clipIndex) => {

      // Create one EventContext object for each clip.
      const context = {
        bpm,
        track,
        clip,
        clipIndex,
        data: {},
      };

      if (clip.midiEvents && clip.midiEvents.length) {
        newTrack.contents.push(midiEventsToReaperObject(clip.midiEvents, context));
      }

      if (clip.fileEvents && clip.fileEvents.length) {
        newTrack.contents = newTrack.contents.concat(fileEventsToReaperObject(clip.fileEvents, context));
      }
    }); // track.clips.forEach

    // Handle track specific automation.
    for (const [name, automation] of Object.entries(track.automation)) {
      let autoObject: any;
      let normalize  = (v) => v;

      if (name === 'gain') {
        autoObject = new rppp.objects.ReaperVolumeAutomation();
        normalize = db2Gain;
      } else if (name === 'pan') {
        autoObject = new rppp.objects.ReaperPanAutomation();
      } else if (name === 'width') {
        autoObject = new rppp.objects.ReaperWidthAutomation();
      }

      if (!autoObject) {
        throw new Error(`Unsupported reaper track automation lane: "${name}"`);
      }

      for (const autoPoint of automation.points) {
        if (typeof autoPoint.value === 'number') {
          autoObject.addBezierPoint(
            autoPoint.startTime * 4 * 60 / bpm,
            normalize(autoPoint.value),
            autoPoint.curve
          );
        }
      }
      newTrack.add(autoObject);
    } // for [name, automation] of track.automation

    // Handle plugins/plugin automation
    const count : any = {};
    const nth = (plugin : FluidPlugin) => {
      const str = plugin.pluginName + '|' + plugin.pluginType;
      if (!count.hasOwnProperty(str)) count[str] = 0;
      return count[str]++;
    }

    if (track.plugins.length > 0) {
      const FXChain = new rppp.objects.ReaperFXChain();
      newTrack.add(FXChain);

      for (const plugin of track.plugins) {
        const vst2 = await vst2ToReaperObject(client, track.name, plugin, nth(plugin), bpm);
        FXChain.add(vst2);
      } // for (plugin of track.plugins)
    }
  }     // for (track of tracks)
  return reaperProject;
};

/**
 * @param {ClipEvent[]} midiEvents
 * @param {ClipEventContext} context This will not have a .eventIndex
 */
function midiEventsToReaperObject(midiEvents, context) {
  if (typeof context.clip.startTime !== 'number')
    throw new Error('Clip is missing startTime');

  const midiItem = new rppp.objects.ReaperMidiItem();
  const clipName  = `${context.track.name} ${context.clipIndex}`;
  const startTime = context.clip.startTime;
  const duration  = context.clip.duration;
  midiItem.getOrCreateStructByToken('NAME').params[0] = clipName;
  midiItem.getOrCreateStructByToken('POSITION').params[0] = startTime * 4 * 60 / context.bpm;
  midiItem.getOrCreateStructByToken('LENGTH').params[0] = duration * 4 * 60 / context.bpm;

  let midiArray : any[] = []
  for (const event of midiEvents) {
    if (event.type === 'midiNote') {
      let velocity = (event.d && typeof event.d.v === 'number')
        ? event.d.v
        : (typeof event.v === 'number')
          ? event.v
          : undefined;
      midiArray.push({ n: event.n, s: event.startTime, l: event.duration, v: velocity });
    }
  }

  midiItem.getOrCreateStructByToken('SOURCE').contents = rppp.objects.ReaperMidiItem.getMidiMessage(midiArray);
  return midiItem;
};

/**
 * @param {ClipEvent[]} fileEvents
 * @param {ClipEventContext} context This will not have a .eventIndex
 */
function fileEventsToReaperObject(fileEvents, context) {
  if (typeof context.clip.startTime !== 'number')
    throw new Error('Clip is missing startTime');

  // exampleClipEvent = {
  //   type: 'file',
  //   path: 'media/kick.wav',
  //   startTime: 0.50,
  //   duration: 0.25,
  //   d: { v: 70, dbfs: -10 }, // If .v is present here...
  // };

  return fileEvents.map((event, eventIndex) => {
    const startTime = context.clip.startTime + event.startTime;

    if (typeof event.path !== 'string') {
      console.error(event);
      throw new Error('tracksToFluidMessage: A file event found in the note library does not have a .path string');
    };

    const audioItem = new rppp.objects.ReaperAudioItem();
    const clipName = `s${context.clipIndex}.${eventIndex}`;
    audioItem.getOrCreateStructByToken('NAME').params[0] = clipName;
    audioItem.getOrCreateStructByToken('POSITION').params[0] = startTime * 4 * 60 / context.bpm;;
    audioItem.getOrCreateStructByToken('SOURCE').contents = [{token: 'FILE', params: [event.path]}];

    if (event.startInSourceSeconds)
      audioItem.getOrCreateStructByToken('SOFFS').params[0] = event.startInSourceSeconds

    if (event.oneShot && event.info)
      audioItem.getOrCreateStructByToken('LENGTH').params[0] = event.info.duration - (event.startInSourceSeconds || 0);
    else
      audioItem.getOrCreateStructByToken('LENGTH').params[0] = event.duration * 4 * 60 / context.bpm;

    // apply fade in/out times (if specified)
    if (typeof event.fadeOutSeconds === 'number')
      audioItem.getOrCreateStructByToken('FADEOUT').params = [1, event.fadeOutSeconds, 0, 1, 0, 0]
    if (typeof event.fadeInSeconds === 'number')
      audioItem.getOrCreateStructByToken('FADEIN').params = [1, event.fadeInSeconds, 0, 1, 0, 0]

    // If there is a dynamics object, look for a dbfs property and apply gain.
    if (event.d && typeof(event.d.dbfs) === 'number')
      audioItem.getOrCreateStructByToken('VOLPAN').params = [1, 0, db2Gain(event.d.dbfs), -1]

    return audioItem;
  });
}

module.exports = tracksToReaperProject;