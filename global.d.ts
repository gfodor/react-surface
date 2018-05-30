declare namespace JSX {
  interface IntrinsicElements {
    text: SurfaceProps;
    surface: SurfaceProps;
  }
}

type CSSProps = React.CSSProperties;
type Percentage = string; // TODO can typescript enforce percentage strings?
type SurfaceTweenInstruction = any;
type SurfaceValue = number | SurfaceTweenInstruction;
type SurfaceValueP = SurfaceValue | Percentage; // SurfaceValue with percentage support
type SurfaceChild = React.ReactElement<SurfaceProps> | React.ReactNode;
type SurfaceStyle = YogaProps & RenderProps;
interface SurfaceStyleDict {
  [key: string]: SurfaceStyle;
}
type SurfaceMaskId = number | string;

// TODO use 'color' package
type IColor =
  | SurfaceTweenInstruction
  | {
      rgbNumber(): number;
      red(): number;
      green(): number;
      blue(): number;
      alpha(): number;
    };

interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface Bounds {
  top: number;
  right: number;
  width: number;
  height: number;
  bottom: number;
  left: number;
}

interface YogaProps {
  position?: "absolute" | "relative";
  alignContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "stretch";
  alignItems?: "flex-start" | "flex-end" | "center" | "baseline" | "stretch";
  alignSelf?:
    | "auto"
    | "flex-start"
    | "flex-end"
    | "center"
    | "baseline"
    | "stretch";
  flexAlign?: any;
  flexBasis?: SurfaceValue;
  flexDirection?: "row" | "row-reverse" | "column" | "column-reverse";
  flexFlow?: string;
  flexGrow?: SurfaceValue;
  flexItemAlign?: any;
  flexLinePack?: any;
  flexOrder?: any;
  flexShrink?: SurfaceValue;
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  top?: SurfaceValueP;
  right?: SurfaceValueP;
  bottom?: SurfaceValueP;
  left?: SurfaceValueP;
  width?: SurfaceValueP;
  height?: SurfaceValueP;
  minWidth?: SurfaceValueP;
  minHeight?: SurfaceValueP;
  maxWidth?: SurfaceValueP;
  maxHeight?: SurfaceValueP;
  justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  margin?: SurfaceValueP;
  marginBottom?: SurfaceValueP;
  marginLeft?: SurfaceValueP;
  marginRight?: SurfaceValueP;
  marginTop?: SurfaceValueP;
  padding?: SurfaceValueP;
  paddingBottom?: SurfaceValueP;
  paddingLeft?: SurfaceValueP;
  paddingRight?: SurfaceValueP;
  paddingTop?: SurfaceValueP;
  border?: SurfaceValueP;
  borderTop?: SurfaceValueP;
  borderRight?: SurfaceValueP;
  borderBottom?: SurfaceValueP;
  borderLeft?: SurfaceValueP;
  overflow?: "visible" | "hidden" | "scroll";
  opacity?: SurfaceValue;
}

type RenderProps = SurfaceTransform & {
  color?: IColor;
  textAlign?: "start" | "center" | "end";
  wordWrap?: boolean;
  letterSpacing?: SurfaceValue;
  fontFamily?: string | string[];
  fontSize?: SurfaceValue;
  fontStyle?: string;
  fontWeight?: string;

  backgroundGradient?: any; // TODO type
  backgroundColor?: IColor;
  backgroundImage?: any;
  backgroundOpacity?: SurfaceValue;
  backgroundPosition?: SurfaceValueP[];
  backgroundSize?: "auto" | "cover" | "contain" | Percentage | Percentage[];

  borderRadius?: SurfaceValue;
  borderColor?: IColor;
  borderColorTop?: IColor;
  borderColorRight?: IColor;
  borderColorBottom?: IColor;
  borderColorLeft?: IColor;

  dropShadowDistance?: SurfaceValue;
  dropShadowColor?: IColor;
  dropShadowAlpha?: SurfaceValue;
  dropShadowSize?: SurfaceValue;
  dropShadowRotation?: SurfaceValue;

  mask?: SurfaceMaskId;
  maskedBy?: SurfaceMaskId;
};

interface SurfaceTransform {
  translateX?: SurfaceValue;
  translateY?: SurfaceValue;
  scaleX?: SurfaceValue;
  scaleY?: SurfaceValue;
  rotation?: SurfaceValue;
  skewX?: SurfaceValue;
  skewY?: SurfaceValue;
  pivotX?: SurfaceValue;
  pivotY?: SurfaceValue;
}

interface SurfaceEvents {
  onClick?: (e: PIXI.interaction.InteractionEvent) => void;
  onRightClick?: (e: PIXI.interaction.InteractionEvent) => void;
  onMouseUp?: (e: PIXI.interaction.InteractionEvent) => void;
  onMouseDown?: (e: PIXI.interaction.InteractionEvent) => void;
  onMouseEnter?: (e: PIXI.interaction.InteractionEvent) => void;
  onMouseLeave?: (e: PIXI.interaction.InteractionEvent) => void;
  onMouseMove?: (e: PIXI.interaction.InteractionEvent) => void;
  onTouchStart?: (e: PIXI.interaction.InteractionEvent) => void;
  onTouchEnd?: (e: PIXI.interaction.InteractionEvent) => void;
  onTouchMove?: (e: PIXI.interaction.InteractionEvent) => void;
  onTouchCancel?: (e: PIXI.interaction.InteractionEvent) => void;
  onTouchEndOutside?: (e: PIXI.interaction.InteractionEvent) => void;
  onSizeChanged?: (size: Size) => void;
  onBoundsChanged?: (bounds: Bounds) => void;
}

type SurfaceProps = SurfaceEvents &
  RenderProps &
  YogaProps & {
    // React internals
    key?: string | number;
    ref?: (surf: any) => void;
    hidden?: boolean;
    children?: SurfaceChild | Array<SurfaceChild | SurfaceChild[]>;
  };

// TODO replace types below with actual types from react-reconciler and yoga-layout when they are available

interface FiberNode {
  _debugID: number;
  stateNode: Element; // TODO generate dom node equivalents of all surfaces to enable dev tool highlights
  type: string;
}

interface HostContext {}

interface ReactContainer<TContainerInfo> {
  containerInfo: TContainerInfo;
}

interface ReactReconciler<TRoot> {
  injectIntoDevTools(config: any): void;
  createContainer(root: TRoot): ReactContainer<TRoot>;
  updateContainer<P>(
    element: React.ReactElement<P>,
    container: ReactContainer<TRoot>
  ): void;
}

interface YogaLayout {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface YogaNode {
  reset(): void;
  getParent(): YogaNode;
  getChild(index: number): YogaNode;
  getChildCount(): number;
  insertChild(child: YogaNode, index?: number): void;
  removeChild(child: YogaNode): void;
  calculateLayout(width: number, height: number, direction: any): void;
  getComputedLayout(): YogaLayout;
  setMeasureFunc(fn: () => any): void;
  markDirty(): void;
}

declare module "yoga-layout";
declare module "scroller";
