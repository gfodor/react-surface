import * as React from 'react';
import * as Color from 'color';
import {Tween} from '../../../src';
import {TweenOptions} from '../../../src/lib/tween/TweenOptions';
import {BezierEasing} from '../../../src/lib/tween/BezierEasing';

export class RainbowText extends React.Component<{
  children: string
}> {
  repeat = true;
  offset = new Tween(0, new TweenOptions({duration: 350, easing: BezierEasing.presets.linear}));

  componentWillMount () {
    this.playOnce();
  }

  componentWillUnmount () {
    this.repeat = false;
  }

  async playOnce (target = 1) {
    await this.offset.to(target);
    if (this.repeat) {
      this.playOnce(target + 1);
    }
  }

  render () {
    const characters = Array.from(this.props.children);
    return (
      <surface flexDirection="row" wordWrap flexWrap="wrap">
        {characters.map((character, index) =>
          <RainbowCharacter
            key={index}
            character={character}
            offset={this.offset}
            delay={(index / (characters.length - 1))}
          />
        )}
      </surface>
    );
  }
}

class RainbowCharacter extends React.Component<{
  character: string,
  offset: Tween<number>,
  delay: number
}> {
  size = {width: 0, height: 0};

  tweens = {
    color: new Tween(() => rainbow((this.props.offset.value + this.props.delay) % 1)),
    translateY: new Tween(() => Math.sin(this.props.offset.value + this.props.delay) * this.size.height / 3)
  };

  saveSize = (size: Size) => {
    this.size = size;
  }

  render () {
    return (
      <surface {...this.tweens} onSizeChanged={this.saveSize}>
        {this.props.character}
      </surface>
    );
  }
}

function rainbow (progress: number)  {
  let r = 0.0;
  let g = 0.0;
  let b = 0.0;
  const i = Math.floor(progress * 6);
  const f = progress * 6.0 - i;
  const q = 1 - f;

  switch (i % 6) {
    case 0: r = 1; g = f; b = 0; break;
    case 1: r = q; g = 1; b = 0; break;
    case 2: r = 0; g = 1; b = f; break;
    case 3: r = 0; g = q; b = 1; break;
    case 4: r = f; g = 0; b = 1; break;
    case 5: r = 1; g = 0; b = q; break;
  }

  return Color.rgb(
    Math.floor(r * 255),
    Math.floor(g * 255),
    Math.floor(b * 255)
  );
}
