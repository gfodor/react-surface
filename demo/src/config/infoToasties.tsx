import * as React from 'react';
import {IconWithLabel} from '../ui/IconWithLabel';
import {Link} from '../ui/Link';

export const infoToasties = [
  <IconWithLabel icon={require('../assets/codenjoy-icon.jpg')}>
    Visit <Link url="http://codenjoy.tv">codenjoy.tv</Link> for an even better streaming experience!
  </IconWithLabel>,
  <IconWithLabel icon={require('../assets/discord-icon.png')}>
    {`Do you also enjoy code?\nMove your butt over to discord!`}
    <Link url="https://discord.gg/Y2t9C2s">discord.gg/Y2t9C2s</Link>
  </IconWithLabel>,
  <IconWithLabel icon={require('../assets/instagram-icon.png')}>
    I have instagram: <Link url="http://instagram.com/codenjoy">instagram.com/codenjoy</Link>
  </IconWithLabel>
];

