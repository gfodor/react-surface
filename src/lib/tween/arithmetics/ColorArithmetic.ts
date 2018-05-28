import {IArithmetic} from './IArithmetic';
import * as Color from 'color';
import {VectorArithmetic} from './VectorArithmetic';

export class ColorArithmetic implements IArithmetic<Color> {
  single = Color.rgb(1, 1, 1);
  zero = Color.rgb(0, 0, 0);

  private vectorArithmetic = new VectorArithmetic();

  add (c1: Color, c2: Color): Color {
    return this.piggyback('add', [c1, c2]);
  }

  subtract (c1: Color, c2: Color): Color {
    return this.piggyback('subtract', [c1, c2]);
  }

  multiply (c: Color, factor: number): Color {
    return this.piggyback('multiply', [c, factor]);
  }

  maxDivide (c: Color, divisor: Color): number {
    return this.piggyback('maxDivide', [c, divisor]);
  }

  scalarDivide (c: Color, divisor: number): Color {
    return this.piggyback('scalarDivide', [c, divisor]);
  }

  equals (c1: Color, c2: Color): boolean {
    return this.piggyback('equals', [c1, c2]);
  }

  round (v: Color): Color {
    return this.piggyback('round', [v]);
  }

  abs (c: Color): Color {
    return this.piggyback('abs', [c]);
  }

  test (value: any): boolean {
    return value instanceof Color;
  }

  parse (value: any) {
    return new Color(value);
  }

  private piggyback (functionName: string, args: any[]) {
    const convertedArgs = args.map((arg) =>
      arg instanceof Color ? colorToVector(arg) : arg
    );

    const res = (this.vectorArithmetic as any)[functionName](...convertedArgs);
    if (Array.isArray(res)) {
      res[3] = cap(res[3], 0, 1);
    }
    return res;
  }
}

function colorToVector (c: Color): number[] {
  return [c.red(), c.green(), c.blue(), c.alpha()];
}

function cap (v: number, min: number, max: number) {
  if (v < min) {
    return min;
  }
  if (v > max) {
    return max;
  }
  return v;
}
