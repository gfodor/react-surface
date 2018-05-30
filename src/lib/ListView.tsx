import * as PropTypes from "prop-types";
import * as React from "react";
import { Scroller } from "scroller";

const MAX_CACHED_ITEMS = 100;

export type ScrollHandler = (scrollTop: number) => void;

interface IListViewProps<T> {
  style?: SurfaceStyle;
  numberOfItemsGetter: () => number;
  itemGetter: (index: number, scrollTop: number) => T;
  snapping?: boolean;
  scrollingDeceleration?: number;
  scrollingPenetrationAcceleration?: number;
  onScroll?: ScrollHandler;
}

interface IFakeDomEvent {
  pageX: number;
  pageY: number;
}

export default class ListView<T> extends React.Component<
  IListViewProps<T>,
  any
> {
  public static defaultProps = {
    scrollingDeceleration: 0.95,
    scrollingPenetrationAcceleration: 0.08,
    snapping: false,
    style: { left: 0, top: 0, width: 0, height: 0 }
  };

  public state = {
    bounds: null as Bounds,
    scrollTop: 0
  };

  public scroller: Scroller;
  private itemCache: Map<number, T>;
  private itemHeightCache: Map<number, number>;
  private surfaceElementCache: Map<number, JSX.Element>;
  private tempPoint: PIXI.Point;

  constructor(props: any) {
    super(props);

    this.itemCache = new Map();
    this.itemHeightCache = new Map();
    this.surfaceElementCache = new Map();
    this.tempPoint = new PIXI.Point();
  }

  public componentDidMount() {
    this.createScroller();
    this.updateScrollingDimensions(this.state.bounds);

    /*setInterval(() => {
      this.scroller.scrollBy(0, 250, true)
    }, 500)*/
  }

  public render() {
    if (this.itemCache.size > MAX_CACHED_ITEMS) {
      this.itemCache.clear();
      this.surfaceElementCache.clear();
    }

    const indexes = this.getVisibleItemIndexes();
    let totalScrolled = 0;

    // PERF is this OK?
    for (let i = 0; i < indexes[0]; i += 1) {
      totalScrolled += this.itemHeightCache.get(i) || 1;
    }

    const ty = -(this.state.scrollTop - totalScrolled);
    console.log(
      `totalScrolled: ${totalScrolled} ty: ${ty} first ${indexes[0]}`
    );

    // TODO can't mutate props
    // surface = this.surfaceElementCache.get(itemIndex);

    // const ty = itemIndex * itemHeight * 2 - this.state.scrollTop;
    // const ty = Math.floor(this.state.scrollTop) % itemHeight;
    const items = indexes.map(i => this.renderItem(i, ty));

    const rootProps = {
      ...this.props.style,
      onBoundsChanged: (bounds: Bounds) => {
        this.setState({ bounds });
        // HACK
        setTimeout(() => this.updateScrollingDimensions(bounds), 0);
      },
      onMouseDown: (e: PIXI.interaction.InteractionEvent) =>
        this.handleMouseDown(e),
      onMouseLeave: (e: PIXI.interaction.InteractionEvent) =>
        this.handleMouseOut(e),
      onMouseMove: (e: PIXI.interaction.InteractionEvent) =>
        this.handleMouseMove(e),
      onMouseUp: (e: PIXI.interaction.InteractionEvent) => this.handleMouseUp(e)
    };

    return <surface {...rootProps}>{items}</surface>;
  }

  public renderItem(itemIndex: number, ty: number) {
    const item: T = this.props.itemGetter(itemIndex, this.state.scrollTop);
    const priorItem = this.itemCache.get(itemIndex);
    const itemHeight: number = this.itemHeightCache.get(itemIndex) || 1;

    let totalScrolled = 0;

    for (let i = 0; i < itemIndex; i += 1) {
      totalScrolled += this.itemHeightCache.get(i) || 1;
    }

    let surface;

    // TODO can't mutate props
    // surface = this.surfaceElementCache.get(itemIndex);

    // const ty = itemIndex * itemHeight * 2 - this.state.scrollTop;
    // const ty = Math.floor(this.state.scrollTop) % itemHeight;
    // const ty = this.state.scrollTop - totalScrolled;

    surface = (
      <surface
        top={0}
        left={0}
        translateY={ty}
        key={itemIndex}
        onBoundsChanged={b => {
          this.itemHeightCache.set(itemIndex, b.height);
        }}
      >
        {item}
      </surface>
    );

    this.itemCache.set(itemIndex, item);
    this.surfaceElementCache.set(itemIndex, surface);

    /*if (surface.props.style.width !== this.props.style.width) {
      surface.props.width = this.props.style.width;
    }*/

    /*if (surface.props.style.height !== itemHeight) {
      surface.props.height = itemHeight;
    }*/

    return surface;
  }

  public pixiEventToFakeDomEvent(
    e: PIXI.interaction.InteractionEvent
  ): IFakeDomEvent {
    const localPos = e.data.getLocalPosition(e.target, this.tempPoint);

    return {
      pageX: localPos.x,
      pageY: localPos.y
    };
  }

  public handleMouseDown(e: PIXI.interaction.InteractionEvent) {
    // if (e.button !== 2) return;

    const domEvent = this.pixiEventToFakeDomEvent(e);

    if (this.scroller) {
      this.scroller.doTouchStart([domEvent], e.data.originalEvent.timeStamp);
    }
  }

  public handleMouseMove(e: PIXI.interaction.InteractionEvent) {
    if (this.scroller) {
      const domEvent = this.pixiEventToFakeDomEvent(e);
      e.data.originalEvent.preventDefault();
      this.scroller.doTouchMove([domEvent], e.data.originalEvent.timeStamp);
    }
  }

  public handleMouseUp(e: PIXI.interaction.InteractionEvent) {
    // if (e.button !== 2) return;

    this.handleScrollRelease(e.data.originalEvent);
  }

  public handleMouseOut(e: PIXI.interaction.InteractionEvent) {
    // if (e.button !== 2) return;

    this.handleScrollRelease(e.data.originalEvent);
  }

  public handleScrollRelease(e: MouseEvent | TouchEvent) {
    if (this.scroller) {
      this.scroller.doTouchEnd(e.timeStamp);
      if (this.props.snapping) {
        this.updateScrollingDeceleration();
      }
    }
  }

  public handleScroll(left: number, top: number) {
    this.setState({ scrollTop: top });
    if (this.props.onScroll) {
      this.props.onScroll(top);
    }
  }

  // Scrolling
  // =========

  public createScroller() {
    const options = {
      decelerationRate: this.props.scrollingDeceleration,
      penetrationAcceleration: this.props.scrollingPenetrationAcceleration,
      scrollingX: false,
      scrollingY: true
    };

    this.scroller = new Scroller(
      (l: number, t: number) => this.handleScroll(l, t),
      options
    );
  }

  public updateScrollingDimensions(bounds: Bounds) {
    if (!this.scroller || !bounds) {
      return;
    }

    const width = bounds.width;
    const height = bounds.height;
    const scrollWidth = width;
    const scrollHeight = bounds.height * 100; // TODO
    this.scroller.setDimensions(width, height, scrollWidth, scrollHeight);
  }

  public getVisibleItemIndexes() {
    if (!this.state.bounds) {
      return [];
    }

    const itemIndexes = [];
    const itemCount = this.props.numberOfItemsGetter();
    const scrollTop = this.state.scrollTop;
    let itemScrollTop = 0;

    for (let index = 0; index < itemCount; index += 1) {
      const itemHeight = this.itemHeightCache.get(index) || 10;

      itemScrollTop += itemHeight;

      // Item is completely off-screen bottom
      if (itemScrollTop - scrollTop > this.state.bounds.height) {
        itemIndexes.push(index);
        break;
      }

      // Item is completely off-screen top
      if (itemScrollTop - scrollTop <= -itemHeight) {
        continue;
      }

      // Part of item is on-screen.
      itemIndexes.push(index);
    }

    return itemIndexes;
  }

  public updateScrollingDeceleration() {
    let currVelocity = (this.scroller as any).__decelerationVelocityY;
    const currScrollTop = this.state.scrollTop;
    let targetScrollTop = 0;
    let estimatedEndScrollTop = currScrollTop;

    while (Math.abs(currVelocity) > 0.000001) {
      estimatedEndScrollTop += currVelocity;
      currVelocity *= this.props.scrollingDeceleration;
    }

    // Find the page whose estimated end scrollTop is closest to 0.
    let closestZeroDelta = Infinity;
    const pageCount = this.props.numberOfItemsGetter();
    let pageScrollTop;

    for (let pageIndex = 0, len = pageCount; pageIndex < len; pageIndex += 1) {
      const pageHeight = this.itemHeightCache.get(pageIndex) || 1;

      pageScrollTop = pageHeight * pageIndex - estimatedEndScrollTop;
      if (Math.abs(pageScrollTop) < closestZeroDelta) {
        closestZeroDelta = Math.abs(pageScrollTop);
        targetScrollTop = pageHeight * pageIndex;
      }
    }

    (this.scroller as any).__minDecelerationScrollTop = targetScrollTop;
    (this.scroller as any).__maxDecelerationScrollTop = targetScrollTop;
  }
}
