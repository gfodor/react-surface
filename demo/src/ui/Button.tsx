import * as React from 'react';
import {interaction} from 'pixi.js';
import * as Color from 'color';
import {observer} from 'mobx-react/custom';
import {tweenSugar} from './UISettings';
import {grid} from './UISettings';
import {Interactive} from './Interactive';

@observer
export class Button extends React.Component<{
  label: string,
  onClick?: (e: interaction.InteractionEvent) => void;
}> {
  render () {
    return (
      <Interactive style={styles.button} onClick={this.props.onClick}>
        {this.props.label}
      </Interactive>
    );
  }
}

const styles = {
  button (isHovered: boolean, isActive: boolean) {
    return {
      padding: grid.gutter,
      flexDirection: 'row',
      opacity: tweenSugar.press.toggle(1, 0.8, isActive),
      backgroundColor: tweenSugar.focus.toggle(Color.rgb('#267835'), Color.rgb('#3ea851'), isHovered)
    } as SurfaceStyle;
  }
};
