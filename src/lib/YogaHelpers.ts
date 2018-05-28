const yoga = require('yoga-layout');

const defaultNode = yoga.Node.create();

type YogaValueTransformerFn = (value: any) => any;
type YogaValueTransformerArgsFn = (value: any) => any[];
type YogaValueTransformer = {
  propertyName?: string
  args?: YogaValueTransformerArgsFn,
  transform?: YogaValueTransformerFn
};

const mixedYogaValueTransformers: {[key: string]: YogaValueTransformerFn | YogaValueTransformer} = {
  top: {propertyName: 'position', args: (value: number) => [yoga.EDGE_TOP, value]},
  right: {propertyName: 'position', args: (value: number) => [yoga.EDGE_RIGHT, value]},
  bottom: {propertyName: 'position', args: (value: number) => [yoga.EDGE_BOTTOM, value]},
  left: {propertyName: 'position', args: (value: number) => [yoga.EDGE_LEFT, value]},

  border: {propertyName: 'border', args: (value: number) => [yoga.EDGE_ALL, value]},
  borderTop: {propertyName: 'border', args: (value: number) => [yoga.EDGE_TOP, value]},
  borderRight: {propertyName: 'border', args: (value: number) => [yoga.EDGE_RIGHT, value]},
  borderBottom: {propertyName: 'border', args: (value: number) => [yoga.EDGE_BOTTOM, value]},
  borderLeft: {propertyName: 'border', args: (value: number) => [yoga.EDGE_LEFT, value]},

  margin: {propertyName: 'margin', args: (value: number) => [yoga.EDGE_ALL, value]},
  marginTop: {propertyName: 'margin', args: (value: number) => [yoga.EDGE_TOP, value]},
  marginRight: {propertyName: 'margin', args: (value: number) => [yoga.EDGE_RIGHT, value]},
  marginBottom: {propertyName: 'margin', args: (value: number) => [yoga.EDGE_BOTTOM, value]},
  marginLeft: {propertyName: 'margin', args: (value: number) => [yoga.EDGE_LEFT, value]},

  padding: {propertyName: 'padding', args: (value: number) => [yoga.EDGE_ALL, value]},
  paddingTop: {propertyName: 'padding', args: (value: number) => [yoga.EDGE_TOP, value]},
  paddingRight: {propertyName: 'padding', args: (value: number) => [yoga.EDGE_RIGHT, value]},
  paddingBottom: {propertyName: 'padding', args: (value: number) => [yoga.EDGE_BOTTOM, value]},
  paddingLeft: {propertyName: 'padding', args: (value: number) => [yoga.EDGE_LEFT, value]},
  
  position: {
    propertyName: 'positionType',
    transform (value: string) {
      switch (value) {
        case 'relative': return yoga.POSITION_TYPE_RELATIVE;
        case 'absolute': return yoga.POSITION_TYPE_ABSOLUTE;
      }
      throw new Error('Position not supported: ' + value);
    }
  },

  display (value: string) {
    switch (value) {
      case 'flex': return yoga.DISPLAY_FLEX;
      case 'none': return yoga.DISPLAY_NONE;
    }
    throw new Error('Display not supported: ' + value);
  },

  overflow (value: string) {
    switch (value) {
      case 'visible': return yoga.OVERFLOW_VISIBLE;
      case 'hidden': return yoga.OVERFLOW_HIDDEN;
      case 'scroll': return yoga.OVERFLOW_SCROLL;
    }
    throw new Error('Overflow not supported: ' + value);
  },

  alignItems (value: string) {
    switch (value) {
      case 'auto': return yoga.ALIGN_AUTO;
      case 'flex-start': return yoga.ALIGN_FLEX_START;
      case 'center': return yoga.ALIGN_CENTER;
      case 'flex-end': return yoga.ALIGN_FLEX_END;
      case 'stretch': return yoga.ALIGN_STRETCH;
      case 'baseline': return yoga.ALIGN_BASELINE;
      case 'space-between': return yoga.ALIGN_SPACE_BETWEEN;
      case 'space-around': return yoga.ALIGN_SPACE_AROUND;
    }
    throw new Error('AlignItems not supported: ' + value);
  },

  justifyContent (value: string) {
    switch (value) {
      case 'flex-start': return yoga.JUSTIFY_FLEX_START;
      case 'center': return yoga.JUSTIFY_CENTER;
      case 'flex-end': return yoga.JUSTIFY_FLEX_END;
      case 'space-between': return yoga.JUSTIFY_SPACE_BETWEEN;
      case 'space-around': return yoga.JUSTIFY_SPACE_AROUND;
      case 'space-evenly': return yoga.JUSTIFY_SPACE_EVENLY;
    }
    throw new Error('JustifyContent not supported: ' + value);
  },

  flexDirection (value: string) {
    switch (value) {
      case 'column': return yoga.FLEX_DIRECTION_COLUMN;
      case 'row': return yoga.FLEX_DIRECTION_ROW;
    }
    throw new Error('FlexDirection not supported: ' + value);
  },

  flexWrap (value: string) {
    switch (value) {
      case 'wrap': return yoga.WRAP_WRAP;
      case 'nowrap': return yoga.WRAP_NO_WRAP;
      case 'wrap-reverse': return yoga.WRAP_REVERSE;
    }
    throw new Error('flexWrap not supported: ' + value);
  }
};

const transformerCache: any = {};
function getYogaValueTransformer (propertyName: string) {
  if (transformerCache.hasOwnProperty(propertyName)) {
    return transformerCache[propertyName];
  }

  const mix = {
    propertyName,
    transform: (value: any) => value,
    args: (value?: any) => [value]
  };

  const transformer = mixedYogaValueTransformers[propertyName];
  if (typeof transformer === 'function') {
    mix.transform = transformer;
  } else if (transformer) {
    Object.assign(mix, transformer);
  }

  transformerCache[propertyName] = mix;
  return mix;
}

function getYogaPropertyFunction (node: YogaNode, propertyName: string, method: 'get' | 'set') {
  const functionName = method + propertyName.substr(0, 1).toUpperCase() + propertyName.substr(1);
  return (node as any)[functionName];
}

export function setYogaValue (node: YogaNode, propertyName: string, value: any) {
  const transformer = getYogaValueTransformer(propertyName);
  const getter = getYogaPropertyFunction(node, transformer.propertyName, 'get');
  const setter = getYogaPropertyFunction(node, transformer.propertyName, 'set');

  if (!(getter && setter)) {
    return;
  }

  const valueToSet = value === undefined ?
    getter.apply(defaultNode, transformer.args()) :
    transformer.transform(value);

  setter.apply(node, transformer.args(valueToSet));
}
