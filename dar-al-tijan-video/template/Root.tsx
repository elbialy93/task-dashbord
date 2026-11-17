import React from "react";
import { Composition } from "remotion";
import { BrandVideo, BrandVideoProps, calculateMetadata } from "./Composition";

export const Root: React.FC = () => (
  <Composition
    id="DarAlTijan"
    component={BrandVideo}
    durationInFrames={30 * 30}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{ totalSeconds: 30, segments: [] } as BrandVideoProps}
    calculateMetadata={calculateMetadata}
  />
);
