import * as React from 'react';
import {ToastyItem} from './ToastyItem';
import {observer} from 'mobx-react/custom';
import {LifecycleTransitionGroup} from '../lib/LifecycleTransitionGroup';
import {AppStateComponent} from '../AppStateComponent';

@observer
export class ToastyList extends AppStateComponent<{style?: SurfaceStyle}> {
  render () {
    return (
      <surface
        {...this.props.style}
        onBoundsChanged={(bounds) => this.appState.toasties.updateContainerBounds(bounds)}
      >
        <LifecycleTransitionGroup>
          {this.appState.toasties.visibleToasties.map((toasty, index) => (
            <ToastyItem
              key={toasty.id}
              index={index}
              toasty={toasty}
            />
          ))}
        </LifecycleTransitionGroup>
      </surface>
    );
  }
}
