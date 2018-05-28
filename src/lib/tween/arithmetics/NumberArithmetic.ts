import {IArithmetic} from './IArithmetic';

export class NumberArithmetic implements IArithmetic<number> {
  single = 1;
  zero = 0;

  add (a: number, b: number): number {
    return a + b;
  }

  subtract (a: number, b: number): number {
    return a - b;
  }

  multiply (a: number, b: number): number {
    return a * b;
  }

  maxDivide (a: number, b: number): number {
    return a / b;
  }

  scalarDivide (a: number, b: number): number {
    return a / b;
  }

  equals (a: number, b: number): boolean {
    return a === b;
  }

  round (v: number) {
    return Math.round(v);
  }

  abs (a: number): number {
    return Math.abs(a);
  }

  test (value: any): boolean {
    return typeof value === 'number';
  }

  parse (value: number) {
    return value;
  }
}
