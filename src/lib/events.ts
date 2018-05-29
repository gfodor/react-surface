import {interaction} from 'pixi.js';

type SurfaceEventInfo = {
  pixiNames: string[];
  isInteractive: boolean;
};

// HACK needs to match event types in global.d.ts
export const surfaceEvents: {[key: string]: SurfaceEventInfo} = {
  onClick: {pixiNames: ['click', 'touchend'], isInteractive: true},
  onRightClick: {pixiNames: ['rightclick'], isInteractive: true},
  onMouseDown: {pixiNames: ['mousedown', 'touchstart'], isInteractive: true},
  onMouseUp: {pixiNames: ['mouseup', 'touchend', 'touchendoutside'], isInteractive: true},
  onMouseEnter: {pixiNames: ['mouseover', 'touchstart'], isInteractive: true},
  onMouseLeave: {pixiNames: ['mouseout', 'touchend', 'touchendoutside'], isInteractive: true},
  onMouseMove: {pixiNames: ['mousemove', 'touchmove'], isInteractive: true},
  onSizeChanged: {pixiNames: ['bogusEvent_size'], isInteractive: false},
  onBoundsChanged: {pixiNames: ['bogusEvent_bounds'], isInteractive: false}
};

export const pixiEvents: {[key: string]: SurfaceEventInfo} = {};
for (const surfaceEventName in surfaceEvents) {
  const info = surfaceEvents[surfaceEventName];
  for (const pixiName of info.pixiNames) {
    pixiEvents[pixiName] = info;
  }
}

export function diffEventProps (prevProps: SurfaceProps, nextProps: SurfaceProps) {
  const removed: {[key: string]: (e: interaction.InteractionEvent) => any} = {};
  const added: {[key: string]: (e: interaction.InteractionEvent) => any} = {};
  const changed: {[key: string]: [
    (e: interaction.InteractionEvent) => any,
    (e: interaction.InteractionEvent) => any
  ]} = {};

  for (const name in surfaceEvents) {
    const prev = (prevProps as any)[name];
    const next = (nextProps as any)[name];
    if (prev && next) {
      if (prev !== next) {
        changed[name] = [prev, next];
      }
    } else if (prev && !next) {
      removed[name] = prev;
    } else if (!prev && next) {
      added[name] = next;
    }
  }

  return {removed, added, changed};
}
