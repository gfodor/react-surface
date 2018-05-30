import * as Color from "color";
import * as lorem from "lorem-ipsum";
import { computed } from "mobx";
import { observer } from "mobx-react/custom";
import * as React from "react";
import ListView from "../../../src/lib/ListView";
import { ChatMessage, ChatStore } from "../state/ChatStore";
import { Link } from "./Link";
import { RainbowText } from "./RainbowText";
import { commonStyles, grid } from "./UISettings";

@observer
export class Chatbox extends React.Component<{
  chatStore: ChatStore;
  style: SurfaceStyle;
}> {
  public items: JSX.Element[];

  constructor(props: any) {
    super(props);

    this.items = [];
  }

  @computed
  get entries() {
    const max = 100; // Magic number
    const sorted = this.props.chatStore.messages
      .slice()
      .sort(ChatMessage.compare);
    const slice = sorted.slice(sorted.length > max ? sorted.length - max : 0);

    // Make the last thing each subscriber wrote into a rainbow
    const entries = slice.map(message => ({ message, rainbow: false }));
    entries.reverse();
    const memory: { [key: string]: boolean } = {};
    for (const entry of entries) {
      const msg = entry.message;
      if (
        !memory[msg.username] &&
        msg.badges &&
        msg.badges.hasOwnProperty("subcriber")
      ) {
        memory[msg.username] = true;
        entry.rainbow = true;
      }
    }
    entries.reverse();

    return entries;
  }

  public itemGetter(idx: number, scrollTop: number) {
    let item = this.items[idx];

    if (!item) {
      const style = styles.message;
      style.backgroundColor = Color.rgb((idx * 75) % 255, 0, 0);

      item = <surface {...style}>{lorem({ count: 1 })}</surface>;

      this.items[idx] = item;
    }

    return item;
  }

  public render() {
    const style = {
      ...styles.chatbox,
      ...this.props.style
    };

    return (
      <ListView
        style={style}
        numberOfItemsGetter={() => 1000}
        itemGetter={(idx, top) => this.itemGetter(idx, top)}
      />
    );

    /*return (
      <surface {...style}>
        {this.entries.map((entry) =>
          <ChatboxMessage
            key={entry.message.id}
            store={this.props.chatStore}
            message={entry.message}
            rainbow={entry.rainbow}
          />
        )}
      </surface>
    );*/
  }
}

class ChatboxMessage extends React.Component<{
  store: ChatStore;
  message: ChatMessage;
  rainbow: boolean;
}> {
  public renderBadges(): any[] {
    const urls = Object.values(
      this.props.store.getBadgeUrls(this.props.message.badges)
    );
    return urls.map(url => <Badge key={url} url={url} />);
  }

  public render() {
    const { message } = this.props;
    return (
      <surface {...styles.message}>
        {this.renderBadges()}
        <Username
          color={message.color}
          name={message.username}
          rainbow={this.props.rainbow}
        />
        {formatChatboxMessage(message.text, message.emotes)}
      </surface>
    );
  }
}

function formatChatboxMessage(text: string, emotes: { [key: string]: string }) {
  const words = text.split(/\s+/);
  const formatted = words.map((word, i) => {
    if (/(https?:\/\/\S+)/.test(word)) {
      return (
        <Link key={i} url={word}>
          {word + " "}
        </Link>
      );
    }
    const mention = /@(\w+)/.exec(word);
    if (mention) {
      return (
        <Link key={i} url={`https://twitch.tv/${mention[1]}`}>
          {word + " "}
        </Link>
      );
    }
    if (emotes.hasOwnProperty(word)) {
      return <Emote key={`emote_${word}_${i}`} url={emotes[word]} />;
    }
    return word + " ";
  });
  return formatted;
}

const Emote = ({ url }: { url: string }) => (
  <surface {...styles.emote} backgroundImage={url} />
);
const Badge = ({ url }: { url: string }) => (
  <surface {...styles.badge} backgroundImage={url} />
);
const Username = ({ color, name, rainbow }: any) => (
  <Link url={"http://www.twitch.tv/" + name} {...styles.username(color)}>
    {rainbow ? <RainbowText>{name + ":"}</RainbowText> : `${name}:`}
  </Link>
);

const pixelsForASpace = 5;
const styles = {
  chatbox: {
    ...commonStyles.blueBox,
    // padding: grid.gutter,
    borderRadius: grid.gutter / 2,
    overflow: "hidden"
  } as SurfaceStyle,

  message: {
    flexDirection: "row",
    wordWrap: true,
    flexWrap: "wrap"
    // marginTop: grid.gutter / 2
  } as SurfaceStyle,

  username(color: Color) {
    return {
      color,
      flexDirection: "row",
      fontWeight: "bold",
      marginRight: pixelsForASpace
    } as SurfaceStyle;
  },

  emote: {
    width: 25,
    height: 28,
    marginTop: -7,
    marginRight: pixelsForASpace
  },

  badge: {
    width: 18,
    height: 18,
    marginRight: pixelsForASpace
  }
};
