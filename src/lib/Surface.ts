import {Application, Container, Graphics, Text, TextMetrics, TextStyle, interaction, Sprite} from 'pixi.js';
import {diffEventProps} from './diffEventProps';
import {commonColors} from './constants';
import {getYogaValueTransformer, takeYogaEdgeValues, yogaEventNameMap} from './YogaHelpers';
import {createBorderGraphics, createRectGraphics, resizeAndPositionSprite} from './RenderHelpers';
import * as Color from 'color';
import {Tween} from './tween/Tween';
import TweenInstruction from './tween/TweenInstruction';
import {uniq} from 'lodash';

const yoga = require('yoga-layout');

type TweenableProps<T> = {
  [P in keyof T]: Tween<T[P]>;
};

export class Surface {
  private isDestroyed: boolean;
  private mutableChildren: Surface[] = [];
  private pixiContainer: Container;
  private effectsContainer: Container;
  private childContainer: Container;
  private pixiText: Text;
  public yogaNode: YogaNode;
  public parentNode: Surface;
  public id: number;
  public props: SurfaceProps = {};
  public tweens: TweenableProps<SurfaceProps> = {};

  constructor (
    public root: SurfaceRoot,
    isText: boolean = false,
    container?: Container
  ) {
    if (this instanceof SurfaceRoot) {
      this.root = this;
    }

    this.yogaNode = yoga.Node.create();
    this.pixiContainer = container || new Container();

    // TODO optimize: minimize number of containers
    if (isText) {
      this.yogaNode.setMeasureFunc(this.measureText.bind(this));
      this.pixiText = new PIXI.Text();
      this.pixiContainer.addChild(this.pixiText);
    } else {
      this.childContainer = new Container();
      this.effectsContainer = new Container();
      this.pixiContainer.addChild(this.effectsContainer);
      this.pixiContainer.addChild(this.childContainer);
    }
  }

  destroy () {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }

    for (const child of this.children) {
      child.destroy();
    }

    while (this.yogaNode.getChildCount()) {
      this.yogaNode.removeChild(
        this.yogaNode.getChild(0)
      );
    }

    this.yogaNode.reset();
    this.pixiContainer.destroy();
    this.isDestroyed = true;
    this.root.surfacesWithTweens.delete(this.id);
  }

  get children () {
    return Object.freeze(this.mutableChildren.slice());
  }

  get hostInstance () {
    return this.pixiContainer;
  }

  get textValue () {
    return this.pixiText && this.pixiText.text;
  }

  set textValue (text: string) {
    if (this.pixiText) {
      this.pixiText.text = text;
      this.yogaNode.markDirty();
    }
  }

  get cascadedTextStyle (): PIXI.TextStyleOptions {
    // TODO optimize: generate cascade on property changes instead of on request
    const parentStyle: any = this.parentNode ? {...this.parentNode.cascadedTextStyle} : {};

    const color: Color = this.tweenableProps.color.value;
    const textStyle: PIXI.TextStyleOptions = {
      fill: color ? color.rgbNumber() : undefined,
      wordWrap: this.props.wordWrap !== undefined ? this.props.wordWrap : true,
      align: this.props.textAlign,
      letterSpacing: this.tweenableProps.letterSpacing.value,
      fontFamily: this.props.fontFamily,
      fontSize: this.tweenableProps.fontSize.value,
      fontStyle: this.props.fontStyle,
      fontWeight: this.props.fontWeight
    };

    for (const key in textStyle) {
      if ((textStyle as any)[key] === undefined) {
        delete (textStyle as any)[key];
      }
    }

    return {...parentStyle, ...textStyle};
  }

  get tweenableProps (): TweenableProps<SurfaceProps> {
    return new Proxy(this.tweens, {
      get: (target, key) => {
        return this.tweens.hasOwnProperty(key) ?
          (this.tweens as any)[key] :
            {value: (this.props as any)[key]};
      }
    });
  }

  measureText () {
    const measurement = TextMetrics.measureText(this.pixiText.text, new TextStyle(this.cascadedTextStyle));
    return {
      width: measurement.maxLineWidth,
      height: measurement.lines.length * measurement.lineHeight
    };
  }

  updateProps (deltaProps: SurfaceProps) {
    const prevProps = this.props;
    this.props = Object.assign({}, this.props, deltaProps);
    this.textValue = this.props.value;
    this.updateEvents(prevProps, this.props);
    this.updateTweenableProps(prevProps, this.props);
    this.updateYoga();
  }

  updateEvents (prevProps: SurfaceProps, nextProps: SurfaceProps) {
    const {removed, added, changed} = diffEventProps(prevProps, nextProps);

    for (const name in removed) {
      this.removeEventListener(name, removed[name]);
    }

    for (const name in changed) {
      const [prevHandler, nextHandler] = changed[name];
      this.removeEventListener(name, prevHandler);
      this.addEventListener(name, nextHandler);
    }

    for (const name in added) {
      this.addEventListener(name, added[name]);
    }

    this.pixiContainer.interactive = this.pixiContainer.eventNames().length > 0;
  }

  updateTweenableProps (prevProps: SurfaceProps, nextProps: SurfaceProps) {
    const keys = uniq(Object.keys(prevProps).concat(Object.keys(nextProps)));

    for (const key of keys) {
      const prev = (prevProps as any)[key];
      const next = (nextProps as any)[key];
      let tween = (this.tweens as any)[key];

      if (next instanceof TweenInstruction) {
        if (prev instanceof Tween) {
          tween = undefined;
        }

        // Mount
        if (!tween) {
          tween = new Tween(next.to, next.options);
          tween.instruct(next);
          (this.tweens as any)[key] = tween;
        } else if (!next.equals(tween.lastInstruction)) {
          tween.instruct(next);
        }
        continue;
      }

      if (next instanceof Tween) {
        (this.tweens as any)[key] = tween;
        continue;
      }

      if (tween && prev instanceof TweenInstruction) {
        tween.stop();
      }
    }

    if (Object.keys(this.tweens).length > 0) {
      this.root.surfacesWithTweens.set(this.id, this);
    } else {
      this.root.surfacesWithTweens.delete(this.id);
    }
  }

  updateYoga () {
    const yogaNode = this.yogaNode as any;

    if (this.pixiText) {
      yogaNode.markDirty();
    }

    for (const key in this.props) {
      const transformer = getYogaValueTransformer(key);
      const setFn = yogaNode[transformer.functionName];
      if (setFn) {
        const value = ((this.tweenableProps as any)[key] as Tween<any>).value;
        const args = transformer.transform(value);
        setFn.apply(yogaNode, args);
      }
    }
  }

  updatePixi () {
    const layout = this.yogaNode.getComputedLayout();

    this.pixiContainer.rotation = this.tweenableProps.rotation.value || 0;
    this.pixiContainer.skew.set(
      definedOr(this.tweenableProps.skewX.value, 0),
      definedOr(this.tweenableProps.skewY.value, 0)
    );
    this.pixiContainer.scale.set(
      definedOr(this.tweenableProps.scaleX.value, 1),
      definedOr(this.tweenableProps.scaleY.value, 1)
    );
    this.pixiContainer.pivot.set(
      definedOr(this.tweenableProps.pivotX.value, layout.width / 2),
      definedOr(this.tweenableProps.pivotY.value, layout.height / 2)
    );
    this.pixiContainer.position.set(
      layout.left + definedOr(this.tweenableProps.translateX.value, 0) + this.pixiContainer.pivot.x,
      layout.top + definedOr(this.tweenableProps.translateY.value, 0) + this.pixiContainer.pivot.y
    );

    if (this.pixiText) {
      Object.assign(this.pixiText.style, this.cascadedTextStyle);
    }

    if (this.effectsContainer) {
      // TODO don't clear, use lookup instead
      for (const child of this.effectsContainer.children) {
        this.effectsContainer.removeChild(child);
      }

      const style = {...this.props};
      const borderRadius = definedOr(this.tweenableProps.borderRadius.value, 0);
      const backgroundColor: Color = definedOr(this.tweenableProps.backgroundColor.value);

      let mask: Graphics;
      const getMask = () => {
        if (mask) {
          return mask;
        }
        mask = createRectGraphics(layout, commonColors.transparent, borderRadius);
        this.effectsContainer.addChild(mask);
        return mask;
      };

      if (backgroundColor !== undefined) {
        this.effectsContainer.addChild(
          createRectGraphics(layout, backgroundColor, borderRadius)
        );
      }

      if (style.backgroundImage !== undefined) {
        const sprite = Sprite.fromImage(style.backgroundImage);
        // TODO use central loader instead
        if (sprite.texture.baseTexture.isLoading) {
          sprite.texture.baseTexture.on('loaded', () => {
            if (!this.isDestroyed) {
              this.updatePixi();
            }
          });
        }

        sprite.mask = getMask();
        sprite.alpha = definedOr(this.tweenableProps.backgroundOpacity.value, 1);
        resizeAndPositionSprite(
          sprite,
          layout,
          this.tweenableProps.backgroundPosition.value,
          this.tweenableProps.backgroundSize.value
        );
        this.effectsContainer.addChild(sprite);
      }

      const borderAll = this.tweenableProps.border.value;
      const borderValues = [
        definedOr(this.tweenableProps.borderTop.value, borderAll),
        definedOr(this.tweenableProps.borderRight.value, borderAll),
        definedOr(this.tweenableProps.borderBottom.value, borderAll),
        definedOr(this.tweenableProps.borderLeft.value, borderAll)
      ];

      const borderColorAll = this.tweenableProps.borderColor.value;
      const borderColorValues = [
        definedOr(this.tweenableProps.borderColorTop.value, borderColorAll),
        definedOr(this.tweenableProps.borderColorRight.value, borderColorAll),
        definedOr(this.tweenableProps.borderColorBottom.value, borderColorAll),
        definedOr(this.tweenableProps.borderColorLeft.value, borderColorAll)
      ];

      const hasBorder = borderValues.find((width) => width > 0);
      if (hasBorder) {
        this.effectsContainer.addChild(
          createBorderGraphics(
            layout,
            borderValues,
            borderRadius,
            borderColorValues
          )
        );
      }

      this.pixiContainer.mask = style.overflow === 'hidden' ? getMask() : undefined;
    }
  }

  appendChild (child: Surface) {
    if (!child) {
      return;
    }

    this.childContainer.addChild(child.pixiContainer);

    this.yogaNode.insertChild(child.yogaNode, this.mutableChildren.length);

    this.mutableChildren.push(child);
    child.parentNode = this;
  }

  insertBefore (child: Surface, beforeChild: Surface) {
    if (!child) {
      return;
    }

    let index = this.childContainer.getChildIndex(beforeChild.pixiContainer);
    this.childContainer.addChildAt(child.pixiContainer, index);

    this.yogaNode.insertChild(child.yogaNode, index);

    index = this.mutableChildren.indexOf(beforeChild);
    this.mutableChildren.splice(index, 0, child);
    child.parentNode = this;
  }

  removeChild (child: Surface) {
    if (!child) {
      return;
    }

    if (child.parentNode !== this) {
      throw new Error('Cannot remove child. Argument is not a child of this surface');
    }

    this.yogaNode.removeChild(child.yogaNode);

    this.childContainer.removeChild(child.pixiContainer);

    const index = this.mutableChildren.indexOf(child);
    this.mutableChildren.splice(index, 1);
    child.parentNode = undefined;
  }

  protected addEventListener (name: string, handler: (e: interaction.InteractionEvent) => any) {
    this.pixiContainer.addListener(yogaEventNameMap[name], handler);
  }

  protected removeEventListener (name: string, handler: (e: interaction.InteractionEvent) => any) {
    this.pixiContainer.removeListener(yogaEventNameMap[name], handler);
  }

  emitEvent (name: string, ...args: any[]) {
    this.pixiContainer.emit(yogaEventNameMap[name], ...args);
  }
}

export class SurfaceRoot extends Surface {
  private app: Application;
  private bounds: {width: number, height: number};
  private target?: HTMLElement;

  surfacesWithTweens: Map<number, Surface>;

  constructor (target: HTMLElement) {
    const app = new Application(target.clientWidth, target.clientHeight, {
      transparent: true,
      antialias: true
    });

    target.appendChild(app.view);

    super(null, false, app.stage);

    this.surfacesWithTweens = new Map<number, Surface>();
    this.target = target;
    this.app = app;
    this.app.ticker.add(this.updateTweens.bind(this));
    this.updateBounds();

    if (typeof window !== undefined) {
      window.addEventListener('resize', this.updateBounds.bind(this));
    }
  }

  destroy () {
    super.destroy();
    this.app.destroy(true);
  }

  afterCommit () {
    this.applyLayout();
  }

  private applyLayout () {
    this.yogaNode.calculateLayout(this.bounds.width, this.bounds.height, yoga.DIRECTION_LTR);
    const queue: Surface[] = [this];
    while (queue.length) {
      const next = queue.pop();
      next.updatePixi();
      queue.push(...next.children);
    }
  }

  private updateTweens () {
    Tween.update();

    // TODO optimize: only apply layout when yoga values have been changed
    if (this.surfacesWithTweens.size) {
      this.applyLayout();
    }

    for (const surface of this.surfacesWithTweens.values()) {
      surface.updateYoga();
      surface.updatePixi();
    }
  }

  updateBounds () {
    this.bounds = {
      width: this.target.clientWidth,
      height: this.target.clientHeight
    };
    this.app.view.width = this.bounds.width;
    this.app.view.height = this.bounds.height;
    this.applyLayout();
  }
}

function definedOr<T> (value: T, fallbackValue?: T) {
  return value !== undefined ? value : fallbackValue;
}
