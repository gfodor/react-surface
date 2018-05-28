export interface IArithmetic<T> {
  single: T;
  zero: T;

  add (a: T, b: T): T;
  subtract (a: T, b: T): T;
  multiply (v: T, factor: number): T;
  maxDivide (v: T, divisor: T): number;
  scalarDivide (v: T, divisor: number): T;
  equals (a: T, b: T): boolean;
  round (v: T): T;
  abs (v: T): T;
  test (v: any): boolean;
  parse (v: any): T;
}
