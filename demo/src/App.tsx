import * as React from 'react';
import {fonts} from './assets/fonts';
import * as Color from 'color';
import {SurfaceStyleSheet} from '../../src/lib/SurfaceStyleSheet';
import {Button} from './ui/Button';
import {SurfaceDevTools} from '../../src/lib/SurfaceDevTools';
import {Overlay} from './ui/Overlay';
import {commonStyles, grid} from './ui/UISettings';
import {appStateContext} from './AppStateComponent';
import {AppState} from './state/AppState';
import {observer} from 'mobx-react/custom';
import {observable, computed, action} from 'mobx';
import {HostToasty, ResubToasty, SubToasty} from './state/Toasty';
import {GridOverlay} from './ui/GridOverlay';

export const mockedMessages = [
  'You are looking mighty fine today, good sir!',
  'The pen is mightier than the sword if the sword is very short, and the pen is very sharp.',
  'In ancient times cats were worshipped as gods. They have not forgotten this.',
  '+++Divide By Cucumber Error. Please Reinstall Universe And Reboot +++',
  'The key to a continued heartbeat is to MOVE YOUR FEET.',
  'I give my life, on the steps... To heaven!',
  'My brethren fell to deaths cold embrace, Yet i stand alone against the countless horde!'
];

@observer
export class App extends React.Component<{state: AppState}> {
  static childContextTypes = appStateContext;
  getChildContext () {
    return {
      state: this.props.state
    };
  }

  private behaviorDisposers: Array<() => void>;

  @observable count = 10;

  @computed get text () {
    return Array.from('x'.repeat(this.count)).join(' ');
  }

  componentWillMount () {
    this.behaviorDisposers = this.props.state.initializeBehavior();

    setInterval(() => {
      this.props.state.chatbox.generateMessage();
    }, 1000);
  }

  componentWillUnmount () {
    this.behaviorDisposers.forEach((dispose) => dispose());
  }

  @action
  offset (offset: number) {
    this.count += offset;
  }

  render () {
    const {state} = this.props;
    return (
      <surface {...styles.app}>
        <Overlay/>
      </surface>);
    /*return (
      <surface {...styles.app}>
        <Overlay/>
        {state.options.enableDevTools && (
          <React.Fragment>
            <DevToolsMenu state={state}/>
            {state.options.enableGridOverlay && <GridOverlay/>}
          </React.Fragment>
        )}
      </surface>
    );*/
  }
}

const DevToolsMenu = ({state}: {state: AppState}) => (
  <surface {...styles.devToolsMenu}>
    <SurfaceDevTools store={state.surface} />
    <Button label="Sub" onClick={() =>
      state.toasties.addToasty(
        new SubToasty('tester', 'Prime', randomizeItem(mockedMessages))
      )
    }/>
    <Button label="Resub" onClick={() =>
      state.toasties.addToasty(
        new ResubToasty('tester', 'Prime', randomizeItem(mockedMessages), 4)
      )
    }/>
    <Button label="Host" onClick={() =>
      state.toasties.addToasty(
        new HostToasty('tester', 1337, false)
      )
    }/>
    <Button label="Info" onClick={() => state.toasties.addNextInfoToasty()}/>
    <Button label="Message" onClick={() => state.chatbox.generateMessage()}/>
    <Button label="GridOverlay" onClick={() => state.options.setEnableGridOverlay(!state.options.enableGridOverlay)}/>
  </surface>
);

const styles = SurfaceStyleSheet.create({
  app: {
    flexGrow: 1,
    backgroundColor: Color.rgb('#000000'),
    color: Color.rgb('#ffffff'),
    fontSize: grid.fontSize(0.30),
    fontFamily: fonts.Default
  },

  devToolsMenu: {
    position: 'absolute',
    top: grid.gutter, left: grid.gutter,
    flexDirection: 'row'
  },

  toastyOverlay: commonStyles.dock
});

function randomizeItem<T> (items: T[]) {
  const randomIndex = Math.floor(Math.random() * (items.length) - 0.01);
  return items[randomIndex];
}
