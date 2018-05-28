import {observable, action} from 'mobx';
import * as Color from 'color';

let messageIdCounter = 0;

export class ChatStore {
  @observable messages: ChatMessage[] = [];
  @observable badges: BadgeSets = {};

  @action
  addMessage (message: ChatMessage) {
    this.messages.push(message);
  }

  @action
  updateBadges (badgeSets: BadgeSets) {
    this.badges = badgeSets;
  }

  generateMessage () {
    this.addMessage(
      new ChatMessage(
        '1337haxx',
        'What a lovely message, look at it overflow, Kappa'
      )
    );
  }

  getBadgeUrls (references: BadgeReferences) {
    const badgeUrls: {[key: string]: string} = {};
    for (const badgeName in references) {
      const badgeVersion = references[badgeName];
      const versions = this.badges[badgeName] && this.badges[badgeName].versions;
      if (versions) {
        const version = versions[badgeVersion] || versions[Object.keys(versions)[0]];
        badgeUrls[badgeName] = version.image_url_1x;
      }
    }
    return badgeUrls;
  }
}

export type ChatMessageEmotes = {[key: string]: string};

export class ChatMessage {
  id: number = messageIdCounter += 1;
  createdAt: Date = new Date();

  constructor (
    public username: string,
    public text: string,
    public emotes: ChatMessageEmotes = {},
    public badges: BadgeReferences = {},
    public color: Color = ChatMessage.getColorForUsername(username)
  ) {}

  static getColorForUsername (username: string): Color {
    let hash = 0;
    for (let i = 0; i < username.length; i += 1) {
       hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    return new Color(hash);
  }

  static compare (a: ChatMessage, b: ChatMessage) {
    if (a.createdAt === b.createdAt) {
      return 0;
    }
    return a.createdAt < b.createdAt ? -1 : 1;
  }
}

export type BadgeReferences = {[key: string]: string};
export type BadgeSets = {[key: string]: BadgeSet};
export type BadgeSet = {versions: {[key: string]: BadgeUrls}};
export type BadgeUrls = {
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  description: string;
  title: string;
  click_action: string;
  click_url: string;
};
