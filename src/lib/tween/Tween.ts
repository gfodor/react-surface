import {getArithmetic, defaultOptions} from './settings';
import {TweenOptions} from './TweenOptions';
import TweenInstruction, {TweenInstructionProps} from './TweenInstruction';
import {TweenSugar} from './TweenSugar';
import {IArithmetic} from './arithmetics/IArithmetic';

const TWEEN = require('tween.js');

let idCounter = 0;

type ValueFunction<TValue> = () => TValue;

export class Tween<TValue> {
  public readonly id = idCounter += 1;
  public promise: Promise<TValue>;

  private valueFunction?: ValueFunction<TValue>;
  private intrinsicValue?: TValue;
  private internalTween?: TWEEN.Tween;
  private resolvers: Array<(value: TValue) => void> = [];
  private arithmetic: IArithmetic<TValue>;
  private sugar = new TweenSugar(this.options);

  instruction: TweenInstruction<TValue>;

  constructor (
    value: TValue | ValueFunction<TValue>,
    public options: TweenOptions = defaultOptions
  ) {
    if (typeof value === 'function') {
      this.valueFunction = value;
      this.promise = Promise.resolve<TValue>(this.valueFunction());
    } else {
      this.intrinsicValue = value;
      this.arithmetic = getArithmetic(value);
      this.promise = Promise.resolve<TValue>(value);
    }
  }

  get value () {
    const value = this.valueFunction ? this.valueFunction() : this.intrinsicValue;
    return this.options.rounded ? this.arithmetic.round(value) : value;
  }

  private onTweenCompleted () {
    delete (this.internalTween as any).__owner;
    delete this.internalTween;
    while (this.resolvers.length) {
      this.resolvers.pop()!(this.value);
    }
  }

  stop () {
    if (this.internalTween) {
      this.internalTween.stop();
      delete this.internalTween;
    }
  }

  instruct (inst: TweenInstruction<TValue>) {
    // Merge tween options with expression options
    inst = inst.extend({options: this.options.extend(inst.options)});

    // Remember the instruction
    const previousInstruction = this.instruction;
    this.instruction = inst;

    // Stop any ongoing instructions
    this.stop();

    // In immediate mode set the value immediately for the first instruction received
    if (!previousInstruction && inst.options.immediate) {
      this.set(inst.to);
      return;
    }

    if (inst.from !== undefined) {
      this.intrinsicValue = inst.from;
    }

    this.promise = new Promise<TValue>((resolve) => {
      this.resolvers.push(resolve);

      let duration = inst.options!.duration;

      if (inst.speed !== undefined) {
        const delta = this.arithmetic.abs(
          this.arithmetic.subtract(inst.to, this.intrinsicValue)
        );
        const numberOfFrames = this.arithmetic.maxDivide(delta, inst.speed);
        duration = 16 * numberOfFrames;
      }

      if (duration === undefined) {
        throw new Error('Either speed or duration must be configured for tween instructions');
      }

      const tweenTarget = {progress: 0};
      this.internalTween = new TWEEN.Tween(tweenTarget);
      (this.internalTween as any).__owner = this;

      const startValue = this.intrinsicValue;
      const delta = this.arithmetic.subtract(inst.to, startValue);

      this.internalTween!
        .easing(inst.options!.easing.get.bind(inst.options!.easing))
        .delay(inst.options!.delay)
        .to({progress: 1}, duration)
        .onUpdate(() => {
          this.intrinsicValue = this.arithmetic.parse(
            this.arithmetic.add(
              startValue,
              this.arithmetic.multiply(delta, tweenTarget.progress)
            )
          );
        })
        .onComplete(this.onTweenCompleted.bind(this))
        .start();
    });

    return this.promise;
  }

  // Syntax sugar for common tween instructions

  set (value: TValue) {
    this.intrinsicValue = value;
  }

  toggle (offValue: TValue, onValue: TValue, isOn: boolean, options?: TweenOptions) {
    return this.instruct(this.sugar.toggle(offValue, onValue, isOn, options));
  }

  to (to: TValue, props: Partial<TweenInstructionProps<TValue>> = {}) {
    return this.instruct(this.sugar.to(to, props));
  }

  from (from: TValue, props: Partial<TweenInstructionProps<TValue>> = {}) {
    return this.instruct(this.sugar.from(from, props));
  }

  transition (from: TValue, to: TValue, props: Partial<TweenInstructionProps<TValue>> = {}) {
    return this.instruct(this.sugar.transition(from, to, props));
  }

  static update (): Tween<any>[] {
    TWEEN.update();
    return TWEEN.getAll().map(
      (internalTween: TWEEN.Tween) => (internalTween as any).__owner
    );
  }
}
