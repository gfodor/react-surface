import {BezierEasing} from './BezierEasing';

class TweenOptionsProps {
  easing: BezierEasing = BezierEasing.presets.easeOut;
  delay: number = 0;
  duration: number = 1000;
  immediate: boolean; // Immediately 'set' the first tween value received, no matter which tween method is used
  rounded: boolean;

  protected props: Partial<TweenOptionsProps>;

  constructor (props: Partial<TweenOptionsProps> = {}) {
    Object.assign(this, props);
    this.props = props;
  }
}

export class TweenOptions extends TweenOptionsProps {
  extend (ext?: Partial<TweenOptionsProps>) {
    if (!ext || ext === this) {
      return this;
    } if (ext instanceof TweenOptions) {
      return new TweenOptions({...this.props, ...ext.props});
    }
    return new TweenOptions({...this.props, ...ext});
  }

  equals (other: TweenOptions) {
    if (!other) {
      return false;
    }

    return this.duration === other.duration &&
      this.delay === other.delay &&
      this.easing.equals(other.easing);
  }
}
