import * as React from 'react';
import {observer} from 'mobx-react/custom';
import {commonStyles, grid} from './UISettings';
import {SurfaceStyleSheet} from '../../../src/lib/SurfaceStyleSheet';
import * as Color from 'color';
import {observable, action} from 'mobx';

@observer
export class GridOverlay extends React.Component {
  @observable rows = grid.rows;
  @observable columns = grid.columns;

  @action
  updateVisibleCells ({width, height}: Size) {
    this.columns = Math.ceil((width - grid.paddingLeft - grid.paddingRight) / (grid.columnWidth + grid.gutterWidth));
    this.rows = Math.ceil((height - grid.paddingTop - grid.paddingBottom) / (grid.rowHeight + grid.gutterHeight));
  }

  render () {
    return (
      <surface {...styles.gridOverlay} onSizeChanged={this.updateVisibleCells.bind(this)} letterSpacing={5}>
        <surface {...styles.grid}>
          {count(this.rows).map((rowNumber) => (
            <surface key={rowNumber} flexDirection="row">
              {count(this.columns).map((columnNumber) => (
                <surface key={columnNumber} {...styles.cell}/>
              ))}
            </surface>
          ))}
        </surface>
      </surface>
    );
  }
}

const styles = SurfaceStyleSheet.create({
  gridOverlay: {
    ...commonStyles.dock,

    paddingTop: grid.paddingTop,
    paddingRight: grid.paddingRight,
    paddingBottom: grid.paddingBottom,
    paddingLeft: grid.paddingLeft,

    opacity: 0.4,
    backgroundColor: Color.rgb('#ff0000')
  },

  grid: {
    flexGrow: 1,
    backgroundColor: Color.rgb('#0000ff'),
    overflow: 'hidden'
  },

  cell: {
    width: grid.columnWidth,
    height: grid.rowHeight,
    backgroundColor: Color.rgb('#00ff00'),
    marginRight: grid.gutter,
    marginBottom: grid.gutter
  }
});

function count (n: number) {
  const items = [];
  for (let i = 0; i < n; i += 1) {
    items.push(i);
  }
  return items;
}
