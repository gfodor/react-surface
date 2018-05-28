import {InfoToasty, Toasty, ToastyState} from './Toasty';
import {observable, computed, action, reaction, when} from 'mobx';

const emptyBounds = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0
};

export const maxToastyLogSize = 3;
const toastyCooldown = 5000;
const infoToastyCooldown = 60 * 5 * 1000;
const toastyTimes: {[key: string]: number} = {
  [ToastyState.Exclaiming]: 1500,
  [ToastyState.Presenting]: 6000
};

export class ToastyStore {
  private isRunning: boolean = false;
  private toastyTimeoutIds: any = {};
  private infoToastyContent: any[] = [];
  private nextInfoToastyIndex: number = -1;

  @observable toasties: Toasty[] = [];
  @observable containerBounds: Bounds = emptyBounds;
  @observable overlaySize: Size = {width: 0, height: 0};

  @computed get visibleToasties () {
    return this.toasties
      .filter((toasty) => toasty.state > ToastyState.Idle && toasty.state < ToastyState.Archived)
      .sort(Toasty.compareAge);
  }

  @computed get loggedToasties () {
    return this.toasties
      .filter((toasty) => toasty.state === ToastyState.Logging)
      .sort(Toasty.compareAge);
  }

  @action
  addToasty (toasty: Toasty) {
    this.toasties.push(toasty);
  }

  @action
  updateContainerBounds (bounds: Bounds) {
    this.containerBounds = bounds;
  }

  @action
  updateOverlaySize (size: Size) {
    this.overlaySize = size;
  }

  setInfoToastyContent (content: any[]) {
    this.infoToastyContent = content;
  }

  addNextInfoToasty () {
    this.nextInfoToastyIndex = (this.nextInfoToastyIndex + 1) % this.infoToastyContent.length;
    const toasty = new InfoToasty(this.infoToastyContent[this.nextInfoToastyIndex]);
    this.addToasty(toasty);

    when(
      () => toasty.state === ToastyState.Archived,
      () => {
        if (this.isRunning) {
          setTimeout(() => this.addNextInfoToasty(), infoToastyCooldown);
        }
      }
    );
  }

  private findToasty (from: ToastyState, to: ToastyState = from) {
    return this.toasties
      .filter((toasty) => toasty.state >= from && toasty.state <= to)
      .sort(Toasty.compareAge)[0];
  }

  private progressToasty (toasty: Toasty, to: ToastyState = toasty.state + 1) {
    toasty.progress(to);

    if (toasty.state < ToastyState.Logging) {
      clearTimeout(this.toastyTimeoutIds[toasty.id]);
      const nextMode = toasty.state + 1;
      this.toastyTimeoutIds[toasty.id] = setTimeout(
        () => this.progressToasty(toasty, nextMode),
        toastyTimes[toasty.state] || 0
      );
    }
  }

  private acceptNextToasty () {
    const pres = () => this.findToasty(ToastyState.Exclaiming, ToastyState.Presenting);
    const idle = () => this.findToasty(ToastyState.Idle);

    when(
      () => !pres() && !!idle(),
      () => {
        if (this.isRunning) {
          const toasty = idle();
          this.progressToasty(toasty);
          when(
            () => toasty.state > ToastyState.Presenting,
            () => setTimeout(() => this.acceptNextToasty(), toastyCooldown)
          );
        }
      }
    );
  }

  initializeBehavior () {
    this.isRunning = true;

    this.acceptNextToasty();
    this.addNextInfoToasty();

    return [
      () => this.isRunning = false,

      // Archive toasties when log is full
      reaction(
        () => this.loggedToasties,
        (logged) => {
          const expired = logged.length - maxToastyLogSize;
          if (expired > 0) {
            logged
              .slice(0, expired)
              .forEach((toasty) => {
                toasty.progress(ToastyState.Archived);
                delete this.toastyTimeoutIds[toasty.id];
              });
          }
        },
        true
      )
    ];
  }
}
