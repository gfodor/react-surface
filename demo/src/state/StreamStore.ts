import {observable, action, computed} from 'mobx';
import {currentTime} from './_static';

export class StreamStore {
  @observable isOnline: boolean = false;
  @observable createdAt: Date = new Date();
  @observable viewerCount: number = 0;
  @observable game: string;
  @observable title = '';
  @observable totalViews: number = 0;
  @observable totalFollowers: number = 0;

  @computed get uptime () {
    return currentTime.get().getTime() - this.createdAt.getTime();
  }

  @action
  setIsOnline (online: boolean) {
    this.isOnline = online;
  }

  @action
  update (
    createdAt: Date, viewerCount: number, game: string,
    title: string, totalViews: number, totalFollowers: number
  ) {
    this.createdAt = createdAt;
    this.viewerCount = viewerCount;
    this.game = game;
    this.title = title;
    this.totalViews = totalViews;
    this.totalFollowers = totalFollowers;
  }
}
