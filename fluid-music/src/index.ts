// New Style Plugins
import { DragonflyRoom } from './plugin-dradonfly-room';
import { FluidPlugin, PluginType } from './plugin';
import { tracksToFluidMessage, sessionToTemplateFluidMessage } from './tracksToFluidMessage';
import { FluidSession } from './FluidSession';

// OSC Message Helpers
const plugin = require('./cybr/plugin');
const pluginDragonflyRoomReverb = require('./cybr/plugin-dragonfly-room');
const pluginPodolski = require('./cybr/plugin-podolski');
const pluginTCompressor = require('./cybr/plugin-tcompressor-vst');
const pluginTEqualiser = require('./cybr/plugin-tequaliser');
const pluginTReverber8 = require('./cybr/plugin-treverber8');
const pluginTStereoDelay = require('./cybr/plugin-tstereodelay');
const pluginZebra2Vst2 = require('./cybr/plugin-zebra2-vst2');
const pluginHelm = require('./cybr/plugin-helm');
const pluginDexedVst = require('./cybr/plugin-dexed-vst');
const sampler = require('./cybr/sampler');
const audiofile = require('./cybr/audiofile');
const audiotrack = require('./cybr/audiotrack');
const midiclip = require('./cybr/midiclip');
const transport = require('./cybr/transport');
const global = require('./cybr/global');
const audioclip = require('./cybr/audioclip');
const clip = require('./cybr/clip');
const content = require('./cybr/content');
const tempo = require('./cybr/tempo');


// Other Stuff
const noteLibrary = require('./note-library');
const noteTypes = require('./note-types');
const eventMappers = require('./event-mappers');
const tab = require('./tab');
const groove = require('./groove')
const UdpClient = require('./FluidUdpClient');
const IpcClient = require('./FluidIpcClient');
const converters = require('./converters');
const m = require('./m');
const random = require('./random');
const tracksToReaperProject = require('./tracksToReaperProject');

// JSDoc
const jsDocTypes = require('./jsdoc-types');

export = {
  audioclip,
  audiofile,
  audiotrack,
  UdpClient,
  IpcClient,
  Client: IpcClient,
  clip,
  converters,
  content,
  noteLibrary,
  eventMappers,
  noteTypes,
  global,
  m,
  midiclip,
  plugin,
  pluginDragonflyRoomReverb,
  pluginHelm,
  pluginPodolski,
  pluginTCompressor,
  pluginTEqualiser,
  pluginTReverber8,
  pluginTStereoDelay,
  pluginZebra2Vst2,
  pluginDexedVst,
  random,
  sampler,
  tab,
  tempo,
  sessionToTemplateFluidMessage,
  tracksToFluidMessage,
  tracksToReaperProject,
  transport,
  groove,
  FluidPlugin,
  PluginType,
  DragonflyRoom,

  FluidSession,
};