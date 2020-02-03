#!/usr/bin/env node
const path = require('path');
const fluid = require('fluid-music');
const cloud = require('fluid-recipes').cloud;

const availableNote = [
  ...cloud.allOctaves('b4'),
  ...cloud.allOctaves('c#4'),
  // ...cloud.allOctaves('e5'),
  // ...cloud.allOctaves('g4'),
  // ...cloud.allOctaves('eb4'),
  // ...cloud.allOctaves('e4'),
  // ...cloud.allOctaves('f4'),
];

const cloudConfig = {
  durationInWholeNotes: 6,
  shortestDelta: 1/8,
  longestDelta: 1/1,
};

const notes = cloud.create(availableNote, cloudConfig);

const client = new fluid.Client(9999);
const durationInQuarterNotes = cloudConfig.durationInWholeNotes * 4;

client.send([
  fluid.audiotrack.select('cloud'),
  fluid.midiclip.create('cloud1', 0, durationInQuarterNotes, notes),
  fluid.transport.loop(0, durationInQuarterNotes),
  fluid.audiotrack.gain(0),
  fluid.transport.play(),
  fluid.global.save(path.join(__dirname, 'sessions', 'demo.tracktionedit')),
]);