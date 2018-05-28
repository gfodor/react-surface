import {SurfaceStyleSheet} from '../../../src/lib/SurfaceStyleSheet';
import {Grid} from './Grid';
import * as Color from 'color';
import {TweenSugar} from '../../../src/lib/tween/TweenSugar';
import {TweenOptions} from '../../../src/lib/tween/TweenOptions';
import {BezierEasing} from '../../../src/lib/tween/BezierEasing';
import {defaultOptions} from '../../../src/lib/tween/settings';

const screenWidth = 1920;
const screenHeight = 1080;

export const grid: Grid = new Grid(
  screenWidth, screenHeight,
  16, 16, 10, 10, 2,
  screenHeight * 0.05
);

export const commonColors = {
  white: Color.rgb('#ffffff'),
  black: Color.rgb('#000000'),
  nightBlue: Color.rgb('#051338'),
  darkGray: Color.rgb('#262e33'),
  darkBlue: Color.rgb('#152951'),
  lightBlue: Color.rgb('#4573ae')
};

export const commonStyles = SurfaceStyleSheet.create({
  dock: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0, left: 0
  },

  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center'
  },

  blueBox: {
    backgroundColor: commonColors.darkBlue,
    dropShadowColor: commonColors.nightBlue,
    dropShadowSize: grid.gutter / 2,
    borderRadius: grid.gutter / 2
  },

  label: {
    fontWeight: 'bold'
  }
});

export const tweenSugar = {
  bounce: new TweenSugar(new TweenOptions({duration: 400, easing: new BezierEasing(0, -0.01, .2, 1.64)})),
  press: new TweenSugar(new TweenOptions({duration: 100, easing: BezierEasing.presets.easeOut})),
  focus: new TweenSugar(new TweenOptions({duration: (12 / 60) * 1000, easing: BezierEasing.presets.easeOut})),
  spring: new TweenSugar(new TweenOptions({duration: 300, easing: new BezierEasing(0.215, 0.61, 0.355, 1)})),
  slide: new TweenSugar(defaultOptions.extend({duration: 400, easing: new BezierEasing(.33,.9,.67,.99)}))
};
