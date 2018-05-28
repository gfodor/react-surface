import {Sprite, Graphics} from 'pixi.js';
import {commonColors} from './constants';
import {definedOr, TweenableProps} from './helpers';

export class SurfaceBackground extends Graphics {
  private currentColor: IColor = commonColors.transparent;

  set color (value: IColor) {
    if (value === undefined) {
      value = commonColors.transparent;
    }

    if (this.currentColor.toString() === value.toString()) {
      return;
    }

    this.currentColor = value;
    this.clear();
    this.beginFill(value.rgbNumber(), value.alpha());
    this.drawRect(0, 0, 1, 1);
    this.endFill();
  }
}

export class SurfaceImage extends Sprite {
  update (containerSize: Size, props: TweenableProps<SurfaceProps>) {
    if (props.backgroundImage.value) {
      this.texture = PIXI.Texture.fromImage(props.backgroundImage.value);
    }

    this.alpha = definedOr(props.backgroundOpacity.value, 1);
    this.resize(containerSize, props.backgroundPosition.value, props.backgroundSize.value);
  }

  resize (
    container: Size,
    position: RenderProps['backgroundPosition'] = ['50%', '50%'],
    size: RenderProps['backgroundSize'] = 'contain'
  ) {
    const containerRatio = container.width / container.height;
    const spriteRatio = this.texture.width / this.texture.height;

    let scaleX = 1;
    let scaleY = 1;

    // Determine scale
    let percentage: {x: number, y: number} | undefined;
    if (typeof size === 'string') {
      const p = this.getPercentage(size, -1);
      if (p !== -1) {
        percentage = {x: p, y: p};
      } else if (size === 'cover' ? (containerRatio > spriteRatio) : (containerRatio < spriteRatio)) {
        scaleX = scaleY = container.width / this.texture.width;
      } else {
        scaleX = scaleY = container.height / this.texture.height;
      }
    } else if (Array.isArray(size)) {
      percentage = {
        x: this.getPercentage(size[0]),
        y: this.getPercentage(size[1])
      };
    } else {
      const p = this.getPercentage(size);
      percentage = {x: p, y: p};
    }

    if (percentage !== undefined) {
      scaleX = percentage.x * container.width / this.texture.width;
      scaleY = percentage.y * container.height / this.texture.height;
    }

    // Determine position
    const xPositionPercentage = this.getPercentage(position[0], -1);
    const yPositionPercentage = this.getPercentage(position[1], -1);
    this.position.set(
      xPositionPercentage !== -1 ?
        -(this.texture.width * scaleX - container.width) * xPositionPercentage :
        position[0] as number,
      yPositionPercentage !== -1 ?
        -(this.texture.height * scaleY - container.height) * yPositionPercentage :
        position[1] as number
    );

    this.scale.set(scaleX, scaleY);
  }

  private getPercentage (value: SurfaceValueP, fallbackValue?: number) {
    if (typeof value === 'string') {
      const percentageMatch = /(.*?)%$/.exec(value);
      if (percentageMatch) {
        return parseFloat(percentageMatch[1]) / 100;
      }
    }
    if (fallbackValue === undefined) {
      throw new Error('Could not get percentage');
    }
    return fallbackValue;
  }
}

export class SurfaceBorder extends Graphics {
  static getWidths (props: TweenableProps<SurfaceProps>) {
    const borderAll = definedOr(props.border.value, 0);
    return [
      definedOr(props.borderTop.value, borderAll),
      definedOr(props.borderRight.value, borderAll),
      definedOr(props.borderBottom.value, borderAll),
      definedOr(props.borderLeft.value, borderAll)
    ];
  }

  update (size: Size, props: TweenableProps<SurfaceProps>) {
    const borderWidths = SurfaceBorder.getWidths(props);
    const borderColorAll = definedOr(props.borderColor.value, commonColors.transparent);
    const borderColors = [
      definedOr(props.borderColorTop.value, borderColorAll),
      definedOr(props.borderColorRight.value, borderColorAll),
      definedOr(props.borderColorBottom.value, borderColorAll),
      definedOr(props.borderColorLeft.value, borderColorAll)
    ];

    if (props.borderRadius.value > 0) {
      const firstWidth = borderWidths.find((w) => w > 0) || 0;
      const firstColor = borderColors.find((c) => c !== undefined);
      this.drawRadius(size, firstWidth, firstColor, props.borderRadius.value);
    } else {
      this.drawSquare(size, borderWidths, borderColors);
    }
  }

  drawSquare (size: Size, widths: number[], colors: IColor[]) {
    this.clear();

    // Fill (for masking)
    this.beginFill(commonColors.transparent.rgbNumber(), commonColors.transparent.alpha());
    this.drawRect(0, 0, size.width, size.height);
    this.endFill();

    // Top
    this.beginFill(colors[0].rgbNumber(), colors[0].alpha());
    this.drawRect(0, 0, size.width, widths[0]);
    this.endFill();

    // Right
    this.beginFill(colors[1].rgbNumber(), colors[1].alpha());
    this.drawRect(size.width - widths[1], widths[0], widths[1], size.height - widths[0] - widths[2]);
    this.endFill();

    // Bottom
    this.beginFill(colors[2].rgbNumber(), colors[2].alpha());
    this.drawRect(0, size.height - widths[2], size.width, widths[2]);
    this.endFill();

    // Left
    this.beginFill(colors[3].rgbNumber(), colors[3].alpha());
    this.drawRect(0, widths[0], widths[3], size.height - widths[0] - widths[2]);
    this.endFill();
  }

  drawRadius (size: Size, width: number, color: IColor, radius: number) {
    const offset = width / 2;
    this.clear();
    this.lineStyle(width, color.rgbNumber(), color.alpha());
    this.beginFill(commonColors.transparent.rgbNumber(), commonColors.transparent.alpha());
    this.drawRoundedRect(offset, offset, size.width - offset * 2, size.height - offset * 2, radius);
    this.endFill();
  }
}
