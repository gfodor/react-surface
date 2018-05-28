import * as React from 'react';
import {observer} from 'mobx-react/custom';
import {observable, action} from 'mobx';

@observer
export class Interactive extends React.Component<
  SurfaceProps & {
  children?: SurfaceProps['children'] | ((isHovered: boolean, isActive: boolean) => SurfaceProps['children']);
  style?: (isHovered: boolean, isActive: boolean) => SurfaceStyle;
}> {
  @observable isHovered = false;
  @observable isActive = false;

  static defaultProps = {
    children: (): null => null,
    style: (): null => null
  };

  @action
  setActive (isActive: boolean) {
    this.isActive = isActive;
  }

  @action
  setHovered (isHovered: boolean) {
    this.isHovered = isHovered;
  }

  render () {
    const {style, children, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave, ...rest} = this.props;
    const evaluatedChildren = typeof children === 'function' ?
      children(this.isHovered, this.isActive) :
      children;

    return (
      <surface
        {...style(this.isHovered, this.isActive)}
        {...rest}
        onMouseDown={joinFn(this.setActive.bind(this, true), onMouseDown)}
        onMouseUp={joinFn(this.setActive.bind(this, false), onMouseUp)}
        onMouseEnter={joinFn(this.setHovered.bind(this, true), onMouseEnter)}
        onMouseLeave={joinFn(this.setHovered.bind(this, false), onMouseLeave)}
      >
        {evaluatedChildren}
      </surface>
    );
  }
}

function joinFn (a: any, b: any): any {
  if (a && b) {
    return () => [a(), b()];
  }
  return a || b;
}
