import React from 'react';
import {Composition} from 'remotion';
import {Data, Short, totalFrames} from './Short';
import {Short2} from './v2';
import {Storyboard} from './sb';
import {Data3, Short3, total3} from './v3';
import data03 from '../public/03/data.json';
import {A4Caps, A4Layers, A4Preview, A4_COUNT, A4_TOTAL} from './a4';
import {P5_TOTAL, PolloOverlay} from './pollo';
import {HormigaOverlay, P6_TOTAL} from './hormiga';
import data01 from '../public/01/data.json';
import data02 from '../public/02/data.json';

const d01 = data01 as Data;
const d02 = data02 as Data;
const base = {fps: 30, width: 1080, height: 1920} as const;

export const Root: React.FC = () => (
  <>
    <Composition id="asteroide" component={Short} {...base} durationInFrames={totalFrames(d01)} defaultProps={{data: d01}} />
    <Composition id="asteroide-v2" component={Short2} {...base} durationInFrames={totalFrames(d02)} defaultProps={{data: d02, music: '02/music.wav'}} />
    <Composition id="trex" component={Short3} {...base} durationInFrames={total3(data03 as Data3)} defaultProps={{data: data03 as Data3, music: '03/music.wav'}} />
    <Composition id="a4-layers" component={A4Layers} {...base} durationInFrames={A4_COUNT} />
    <Composition id="pollo-overlay" component={PolloOverlay} {...base} durationInFrames={P5_TOTAL} />
    <Composition id="hormiga-overlay" component={HormigaOverlay} {...base} durationInFrames={P6_TOTAL} />
    <Composition id="a4-caps" component={A4Caps} {...base} durationInFrames={A4_TOTAL} />
    <Composition id="a4-preview" component={A4Preview} {...base} durationInFrames={6} />
    <Composition id="sb-trex" component={Storyboard} {...base} durationInFrames={7} />
  </>
);
