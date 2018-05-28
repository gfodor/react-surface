import {SurfaceStore} from './SurfaceStore';
import {Surface, SurfaceRoot} from './Surface';
import {uniq} from 'lodash';

const createReconciler = require('react-reconciler');
const now = require('performance-now');

export function createSurfaceReconciler (
  root: SurfaceRoot,
  store: SurfaceStore,
  createInstance: (root: SurfaceRoot, type: string) => Surface
): ReactReconciler<SurfaceRoot> {
  return createReconciler({
    getRootHostContext (root: SurfaceRoot): HostContext {
      return {};
    },

    getChildHostContext (parentContext: HostContext, type: string): HostContext {
      return {};
    },

    getPublicInstance (instance: Surface) {
      return instance;
    },

    prepareForCommit () {
      // noop
    },

    resetAfterCommit () {
      root.afterCommit();
    },

    createInstance (type: string, props: SurfaceProps, root: SurfaceRoot, context: HostContext, fiber: FiberNode) {
      const instance = createInstance(root, type);
      store.register(fiber, instance);
      instance.updateProps(props);
      return instance;
    },

    appendInitialChild (parentInstance: Surface, child: Surface) {
      parentInstance.appendChild(child);
    },

    finalizeInitialChildren (instance: Surface, type: string, props: SurfaceProps, root: SurfaceRoot) {
      return false;
    },

    prepareUpdate (
      instance: Surface, type: string, oldProps: SurfaceProps,
      newProps: SurfaceProps, root: SurfaceRoot, context: HostContext
    ) {
      // TODO optimize: diff props
      const prevProps = {...instance.props};
      const nextProps = {...newProps};
      delete prevProps.children;
      delete nextProps.children;

      const changes = diff(prevProps, nextProps);
      if (Object.keys(changes).length > 0) {
        return changes;
      }
    },

    shouldSetTextContent (type: string, props: SurfaceProps): boolean {
      return false;
    },

    shouldDeprioritizeSubtree (type: string, props: SurfaceProps): boolean {
      return !!props.hidden;
    },

    createTextInstance (text: string, root: SurfaceRoot, context: HostContext, fiber: FiberNode) {
      const instance = createInstance(root, 'text');
      store.register(fiber, instance);
      instance.textValue = text;
      instance.updateProps();
      return instance;
    },

    now: () => now(),

    useSyncScheduling: true,

    mutation: {
      commitMount (instance: Surface, type: string, newProps: SurfaceProps, fiber: FiberNode) {

      },

      commitUpdate (
        instance: Surface, payload: SurfaceProps, type: string,
        oldProps: SurfaceProps, newProps: SurfaceProps, fiber: FiberNode
      ) {
        instance.updateProps(payload);
      },

      resetTextContent (instance: Surface) {
        instance.textValue = undefined;
        instance.updateProps();
      },

      commitTextUpdate (instance: Surface, oldText: string, newText: string) {
        instance.textValue = newText;
        instance.updateProps();
      },

      appendChild (parentInstance: Surface, child: Surface) {
        parentInstance.appendChild(child);
      },

      appendChildToContainer (container: SurfaceRoot, child: Surface) {
        container.appendChild(child);
      },

      insertBefore (parentInstance: Surface, child: Surface, beforeChild: Surface) {
        parentInstance.insertBefore(child, beforeChild);
      },

      insertInContainerBefore (container: SurfaceRoot, child: Surface, beforeChild: Surface) {
        container.insertBefore(child, beforeChild);
      },

      removeChild (parentInstance: Surface, child: Surface) {
        parentInstance.removeChild(child);

        // Release child and its sub tree
        const queue = [child];
        while (queue.length) {
          const next = queue.pop();
          store.release(next!);
          queue.push(...next!.children);
        }

        child.destroy();
      },

      removeChildFromContainer (container: SurfaceRoot, child: Surface) {
        container.removeChild(child);
        store.release(child);
        child.destroy();
      }
    }
  });
}

function diff (a: SurfaceProps, b: SurfaceProps): SurfaceProps {
  const propertyNames = uniq(Object.keys(a).concat(Object.keys(b)));
  const changes: any = {};
  for (const name of propertyNames) {
    const prev = (a as any)[name];
    const next = (b as any)[name];
    if (prev && next) {
      if (prev !== next) {
        changes[name] = next;
      }
    } else if (prev && !next) {
      changes[name] = undefined;
    } else if (!prev && next) {
      changes[name] = next;
    }
  }
  return changes;
}
