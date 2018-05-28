import * as React from 'react';
import {Interactive} from './Interactive';
import * as Color from 'color';

type LinkProps = {
  url: string
  children: SurfaceProps['children']
};

export const Link = ({children, url, ...rest}: LinkProps) => (
  <Interactive style={styles.link} onClick={() => window.open(url, '_blank')} {...rest}>
    {children}
  </Interactive>
);

const styles = {
  link (isHovered: boolean, isActive: boolean) {
    return {
      color: isHovered ? Color.rgb(isActive ? '#42acb4' : '#54f7ff') : undefined,
      fontWeight: 'bold'
    };
  }
};
