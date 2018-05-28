import {observable, action} from 'mobx';

export class OptionsStore {
  @observable enableDevTools: boolean;
  @observable enableGridOverlay: boolean;

  @action
  setEnableDevTools (devTools: boolean) {
    this.enableDevTools = devTools;
  }

  @action
  setEnableGridOverlay (gridOverlay: boolean) {
    this.enableGridOverlay = gridOverlay;
  }
}
