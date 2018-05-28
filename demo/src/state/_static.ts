import {observable, action} from 'mobx';

export const currentTime = observable(new Date());
const updateCurrentTime = action(() => currentTime.set(new Date()));
setInterval(updateCurrentTime, 1000);
