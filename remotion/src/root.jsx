import React from 'react';
import {Composition} from 'remotion';
import demo from '../../projects/demo/project.json';
import {IndieVideo} from './video.jsx';
import {totalFrames, validateProject} from './project.js';

export const Root = () => (
  <Composition
    id="IndieVideo"
    component={IndieVideo}
    fps={demo.fps}
    width={demo.width}
    height={demo.height}
    durationInFrames={totalFrames(demo)}
    defaultProps={demo}
    calculateMetadata={({props}) => {
      validateProject(props);
      return {
        fps: props.fps,
        width: props.width,
        height: props.height,
        durationInFrames: totalFrames(props),
      };
    }}
  />
);
