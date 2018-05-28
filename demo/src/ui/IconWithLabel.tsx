import * as React from 'react';
import {commonColors, grid} from './UISettings';

type IconWithLabelProps = {
  icon: string
  children: SurfaceProps['children']
};

export const IconWithLabel = (props: IconWithLabelProps) => (
  <surface flexDirection="row" alignItems="center">
    <surface {...styles.icon(props.icon)}/>
    {props.children}
  </surface>
);

const styles = {
  icon (url: string) {
    const size = grid.ySpan(0.75);
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: commonColors.white,
      backgroundImage: url,
      marginRight: grid.gutter,
      marginLeft: grid.gutter
    };
  }
};
