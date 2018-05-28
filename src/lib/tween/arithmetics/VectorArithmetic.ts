import {IArithmetic} from './IArithmetic';

export class VectorArithmetic implements IArithmetic<number[]> {
  single = [1, 1];
  zero = [0, 0];

  add (v1: number[], v2: number[]): number[] {
    const length = Math.max(v1.length, v2.length);
    const sum = [];
    for (let i = 0; i < length; i += 1) {
      sum[i] = (v1[i] || 0) + (v2[i] || 0);
    }
    return sum;
  }

  subtract (v1: number[], v2: number[]): number[] {
    const length = Math.max(v1.length, v2.length);
    const sum = [];
    for (let i = 0; i < length; i += 1) {
      sum[i] = (v1[i] || 0) - (v2[i] || 0);
    }
    return sum;
  }

  multiply (v: number[], factor: number): number[] {
    const scaled = [];
    for (let i = 0; i < v.length; i += 1) {
      scaled[i] = v[i] * factor;
    }
    return scaled;
  }

  maxDivide (v1: number[], v2: number[]): number {
    const length = Math.max(v1.length, v2.length);

    let max = 0;
    for (let i = 0; i < length; i += 1) {
      const quotient = (v1[i] || 0) / (v2[i] || 0);
      if (Math.abs(quotient) > Math.abs(max)) {
        max = quotient;
      }
    }

    return max;
  }

  scalarDivide (v: number[], divisor: number): number[] {
    const divided = [];
    for (let i = 0; i < v.length; i += 1) {
      divided[i] = v[i] / divisor;
    }
    return divided;
  }

  equals (v1: number[], v2: number[]): boolean {
    if (v1.length !== v2.length) {
      return false;
    }

    for (let i = 0; i < v1.length; i += 1) {
      if (v1[i] !== v2[i]) {
        return false;
      }
    }

    return true;
  }

  round (v: number[]) {
    return v.map(Math.round);
  }

  abs (v: number[]): number[] {
    return v.map((e) => Math.abs(e));
  }

  test (value: any): boolean {
    return Array.isArray(value);
  }

  parse (value: number[]) {
    return value;
  }
}
