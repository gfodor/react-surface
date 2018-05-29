import * as React from 'react';
import { Component, createElement } from 'react';
import * as PropTypes from 'prop-types';
import { Scroller } from 'scroller';

const MAX_CACHED_ITEMS = 100;

export type ScrollHandler = (scrollTop: number) => void;

interface ListViewProps<T> {
  style?: SurfaceStyle;
  numberOfItemsGetter: () => number;
  itemGetter: (index: number, scrollTop: number) => T;
  itemHeightGetter: () => number;
  snapping?: boolean;
  scrollingDeceleration?: number;
  scrollingPenetrationAcceleration?: number;
  onScroll?: ScrollHandler;
}

interface FakeDomEvent {
  pageX: number;
  pageY: number;
}

export default class ListView<T> extends Component<ListViewProps<T>, any> {
  static defaultProps = {
    style: { left: 0, top: 0, width: 0, height: 0 },
    snapping: false,
    scrollingDeceleration: 0.95,
    scrollingPenetrationAcceleration: 0.08
  };

  state = {
    scrollTop: 0,
    bounds: (null as Bounds)
  };

  scroller: Scroller;
  private itemCache: Map<number, T>;
  private surfaceElementCache: Map<number, JSX.Element>;
  private tempPoint: PIXI.Point;

  constructor (props: any) {
    super(props);

    this.itemCache = new Map();
    this.surfaceElementCache = new Map();
    this.tempPoint = new PIXI.Point();
  }

  componentDidMount () {
    this.createScroller();
    this.updateScrollingDimensions(this.state.bounds);

    /*setInterval(() => {
      this.scroller.scrollBy(0, 250, true)
    }, 500)*/
  }

  render () {
    if (this.itemCache.size > MAX_CACHED_ITEMS) {
      this.itemCache.clear();
      this.surfaceElementCache.clear();
    }

    const items = this.getVisibleItemIndexes().map((i) => this.renderItem(i));

    const rootProps = {
      ...this.props.style,
      onMouseDown: (e: PIXI.interaction.InteractionEvent) => this.handleMouseDown(e),
      onMouseUp: (e: PIXI.interaction.InteractionEvent) => this.handleMouseUp(e),
      onMouseLeave: (e: PIXI.interaction.InteractionEvent) => this.handleMouseOut(e),
      onMouseMove: (e: PIXI.interaction.InteractionEvent) => this.handleMouseMove(e),
      onBoundsChanged: (bounds: Bounds) => {
        this.setState({ bounds });
        // HACK
        setTimeout(() => this.updateScrollingDimensions(bounds), 0);
      }
    };

    return (<surface {...rootProps}>{items}</surface>);
  }

  renderItem (itemIndex: number) {
    const item: T = this.props.itemGetter(itemIndex, this.state.scrollTop);
    const priorItem = this.itemCache.get(itemIndex);
    const itemHeight: number = this.props.itemHeightGetter();

    let surface;

    // TODO can't mutate props
    // surface = this.surfaceElementCache.get(itemIndex);

    const ty = itemIndex * itemHeight - this.state.scrollTop;
    // const ty = Math.floor(this.state.scrollTop) % itemHeight;

    surface = (<surface top={0} left={0} translateY={ty} key={itemIndex}>{item}</surface>);

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

  pixiEventToFakeDomEvent (e: PIXI.interaction.InteractionEvent): FakeDomEvent {
    const localPos = e.data.getLocalPosition(e.target, this.tempPoint);

    return {
      pageX: localPos.x,
      pageY: localPos.y
    };
  }

  handleMouseDown (e: PIXI.interaction.InteractionEvent) {
    // if (e.button !== 2) return;

    const domEvent = this.pixiEventToFakeDomEvent(e);

    if (this.scroller) {
      this.scroller.doTouchStart([domEvent], e.data.originalEvent.timeStamp);
    }
  }

  handleMouseMove (e: PIXI.interaction.InteractionEvent) {
    if (this.scroller) {
      const domEvent = this.pixiEventToFakeDomEvent(e);
      e.data.originalEvent.preventDefault();
      this.scroller.doTouchMove([domEvent], e.data.originalEvent.timeStamp);
    }
  }

  handleMouseUp (e: PIXI.interaction.InteractionEvent) {
    // if (e.button !== 2) return;

    this.handleScrollRelease(e.data.originalEvent);
  }

  handleMouseOut (e: PIXI.interaction.InteractionEvent) {
    // if (e.button !== 2) return;

    this.handleScrollRelease(e.data.originalEvent);
  }

  handleScrollRelease (e: MouseEvent | TouchEvent) {
    if (this.scroller) {
      this.scroller.doTouchEnd(e.timeStamp);
      if (this.props.snapping) {
        this.updateScrollingDeceleration();
      }
    }
  }

  handleScroll (left: number, top: number) {
    this.setState({ scrollTop: top });
    if (this.props.onScroll) {
      this.props.onScroll(top);
    }
  }

  // Scrolling
  // =========

  createScroller () {
    const options = {
      scrollingX: false,
      scrollingY: true,
      decelerationRate: this.props.scrollingDeceleration,
      penetrationAcceleration: this.props.scrollingPenetrationAcceleration
    };

    this.scroller = new Scroller((l: number, t: number) => this.handleScroll(l, t), options);
  }

  updateScrollingDimensions (bounds: Bounds) {
    if (!this.scroller || !bounds) {
      return;
    }

    const width = bounds.width;
    const height = bounds.height;
    const scrollWidth = width;
    const scrollHeight =
      this.props.numberOfItemsGetter() * this.props.itemHeightGetter();
    this.scroller.setDimensions(width, height, scrollWidth, scrollHeight);
  }

  getVisibleItemIndexes () {
    if (!this.state.bounds) return [];

    const itemIndexes = [];
    const itemHeight = this.props.itemHeightGetter();
    const itemCount = this.props.numberOfItemsGetter();
    const scrollTop = this.state.scrollTop;
    let itemScrollTop = 0;

    for (let index = 0; index < itemCount; index += 1) {
      itemScrollTop = index * itemHeight - scrollTop;

      // Item is completely off-screen bottom
      if (itemScrollTop >= this.state.bounds.height) {
        continue;
      }

      // Item is completely off-screen top
      if (itemScrollTop <= -itemHeight) {
        continue;
      }

      // Part of item is on-screen.
      itemIndexes.push(index);
    }

    return itemIndexes;
  }

  updateScrollingDeceleration () {
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
    const pageHeight = this.props.itemHeightGetter();
    const pageCount = this.props.numberOfItemsGetter();
    let pageScrollTop;

    for (let pageIndex = 0, len = pageCount; pageIndex < len; pageIndex += 1) {
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
