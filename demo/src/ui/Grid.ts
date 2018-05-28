export class Grid {

  // Grid

  get gutter () {
    return this.gutterWidth || this.gutterHeight;
  }

  get columnWidth () {
    return (this.width - this.gutterWidth * (this.columns - 1)) / this.columns;
  }

  get rowHeight () {
    return (this.height - this.gutterHeight * (this.rows - 1)) / this.rows;
  }

  // Screen
  
  get width () {
    return this.outerWidth - this.paddingLeft - this.paddingRight;
  }
  
  get height () {
    return this.outerHeight - this.paddingTop - this.paddingBottom;
  }

  get aspectRatio () {
    return this.outerWidth / this.outerHeight;
  }

  constructor (
    public outerWidth: number,
    public outerHeight: number,
    public columns: number,
    public rows: number,
    public gutterWidth: number = 0,
    public gutterHeight: number = gutterWidth,
    public border: number = gutterWidth / 5,
    public paddingTop: number,
    public paddingRight: number = paddingTop,
    public paddingBottom: number = paddingTop,
    public paddingLeft: number = paddingRight
  ) {}

  fontSize (rows: number) {
    return this.rowHeight * rows * 0.8660;
  }

  xParts (n: number, gutter = this.gutterWidth) {
    return (this.width - (n - 1) * gutter) / n;
  }

  yParts (n: number, gutter = this.gutterHeight) {
    return (this.height - (n - 1) * gutter) / n;
  }

  xSpan (n: number, gutter = this.gutterWidth) {
    return this.columnWidth * n + gutter * (n - 1);
  }

  ySpan (n: number, gutter = this.gutterHeight) {
    return this.rowHeight * n + gutter * (n - 1);
  }

  vw (n: number) {
    return this.width * (n / 100);
  }

  vh (n: number) {
    return this.height * (n / 100);
  }
}
