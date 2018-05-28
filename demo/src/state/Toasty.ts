import {action, observable, computed} from 'mobx';

let idCounter = 0;

export enum ToastyState {
  Idle,
  Exclaiming,
  Presenting,
  Logging,
  Archived
}

export enum ToastyType {
  Top,
  Middle
}

export class Toasty {
  id: number = idCounter += 1;
  fullContent: any;
  shortContent: any;
  createdAt: Date = new Date();
  type: ToastyType = ToastyType.Middle;

  @observable state = ToastyState.Idle;

  get shouldBeLogged () {
    return this.type !== ToastyType.Top;
  }

  @computed get content () {
    if (this.state <= ToastyState.Exclaiming) {
      return '!';
    }
    if (this.state <= ToastyState.Presenting) {
      return this.fullContent;
    }
    return this.shortContent || this.fullContent;
  }

  @action
  progress (to: ToastyState = this.state + 1) {
    if (!this.shouldBeLogged && to === ToastyState.Logging) {
      this.state = to + 1;
      return;
    }

    if (to !== undefined) {
      if (to > this.state) {
        this.state = to;
      }
    } else {
      this.state += 1;
    }
  }

  static compareAge (a: Toasty, b: Toasty) {
    if (a.createdAt === b.createdAt) {
      return 0;
    }
    return a.createdAt < b.createdAt ? -1 : 1;
  }
}

export class SubToasty extends Toasty {
  constructor (
    username: string,
    method: any,
    message: string
  ) {
    super();

    this.fullContent = `${username} just subscribed!`;
    if (message) {
      this.fullContent += `\n"${message}"`;
    }

    this.shortContent = `Sub: ${username}`;
  }
}

export class ResubToasty extends Toasty {
  constructor (
    username: string,
    method: any,
    message: string,
    months: number
  ) {
    super();

    this.fullContent = `${username} just resubscribed (x${months})!`;
    if (message) {
      this.fullContent += `\n"${message}"`;
    }

    this.shortContent = `Resub: ${username} (x${months})`;
  }
}

export class HostToasty extends Toasty {
  constructor (
    username: string,
    viewers: number,
    autoHost: boolean
  ) {
    super();
    this.fullContent = `${username} just hosted with ${viewers} viewers!`;
    this.shortContent = `Host: ${username} (x${viewers})`;
  }
}

export class InfoToasty extends Toasty {
  constructor (
    message: string,
  ) {
    super();
    this.fullContent = message;
    this.shortContent = message;
    this.type = ToastyType.Top;
  }
}
