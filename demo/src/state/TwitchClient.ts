import axios from 'axios';
import {StreamStore} from './StreamStore';
import {ChatMessage, ChatMessageEmotes, ChatStore} from './ChatStore';
import {ToastyStore} from './ToastyStore';
import {HostToasty, ResubToasty, SubToasty} from './Toasty';
import * as Color from 'color';

const tmi = require('tmi.js');

type TwitchClientOptions = {
  clientID: string;
  channel: string;
};

export class TwitchClient {
  private messageClient: any;
  private krakenClient: KrakenClient;
  private streamPollInterval: number = 10 * 1000;

  constructor (
    private options: TwitchClientOptions
  ) {
    this.krakenClient = new KrakenClient(options.clientID);
    this.messageClient = new tmi.client({
      options: {debug: true},
      connection: {reconnect: true},
      identity: {client_id: options.clientID},
      channels: ['#' + options.channel]
    });
  }

  private async fetchStream (store: StreamStore) {
    const channel = await this.krakenClient.getUser(this.options.channel);
    const stream = await this.krakenClient.getStream(channel._id);

    if (stream) {
      store.setIsOnline(true);
      store.update(
        new Date(stream['created_at']),
        stream.viewers,
        stream.game,
        stream.channel.status,
        stream.channel.viewers,
        stream.channel.followers
      );
    } else {
      store.setIsOnline(false);
    }
  }

  private async loadBadges (chatbox: ChatStore) {
    const response = await axios.get('https://badges.twitch.tv/v1/badges/global/display?language=en');
    chatbox.updateBadges(response.data.badge_sets);
  }

  initialize (streamStore: StreamStore, chatStore: ChatStore, toastyStore: ToastyStore) {
    // Kraken binding
    this.fetchStream(streamStore);
    const streamPollIntervalId = setInterval(
      () => this.fetchStream(streamStore),
      this.streamPollInterval
    );

    // TMI binding
    this.messageClient.connect();
    this.messageClient.on('chat', (channel: string, userState: any, message: string, self: boolean) =>
      chatStore.addMessage(parseChatMessage(channel, userState, message, self))
    );
    this.messageClient.on('subscription', (...args: any[]) =>
      toastyStore.addToasty(new SubToasty(args[1], args[2], args[3]))
    );
    this.messageClient.on('resub', (...args: any[]) =>
      toastyStore.addToasty(new ResubToasty(args[1], args[5], args[3], args[2]))
    );
    this.messageClient.on('hosted', (...args: any[]) =>
      toastyStore.addToasty(new HostToasty(args[1], args[2], args[3]))
    );

    this.loadBadges(chatStore);

    return () => {
      clearInterval(streamPollIntervalId);
      this.messageClient.removeAllListeners();
      this.messageClient.disconnect();
    };
  }
}

class KrakenClient {
  constructor (
    private clientID: string
  ) {}

  async getUser (username: string) {
    const {users} = await this.request('users?login=' + username);
    return users[0];
  }

  async getStream (channelID: string) {
    const {stream} = await this.request('streams/' + channelID);
    return stream;
  }

  private async request (query: string) {
    const response = await axios.get('https://api.twitch.tv/kraken/' + query, {
      headers: {
        Accept: 'application/vnd.twitchtv.v5+json',
        'Client-ID': this.clientID
      }
    });

    return response.data;
  }
}

function parseChatMessage (channel: string, userState: any, message: string, self: boolean) {
  const emoteUrlsByName: ChatMessageEmotes = {};
  for (const emoteId in userState.emotes) {
    const positions = userState.emotes[emoteId];
    const indexes = positions[0].split('-').map((indexString: string) => parseInt(indexString, 10));
    const emoteName = message.substring(indexes[0], indexes[1] + 1);
    const emoteUrl = `http://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/1.0`;
    emoteUrlsByName[emoteName] = emoteUrl;
  }

  const color = userState.color ? Color.rgb(userState.color) : undefined;
  return new ChatMessage(userState['display-name'], message, emoteUrlsByName, userState.badges, color);
}
