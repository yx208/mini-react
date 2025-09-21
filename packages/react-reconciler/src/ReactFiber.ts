import type { ReactElement } from "shared/ReactElementType";
import { isStr } from "shared/utils";
import { HostComponent, HostText, IndeterminateComponent, type WorkTag } from "./ReactWorkTags";
import { Fiber } from "./ReactInternalTypes";

export function createFiber(tag: WorkTag, pendingProps: any, key: string | null) {
    return new Fiber(tag, pendingProps, key);
}

export function createFiberFromText(content: string) {
    return createFiber(HostText, content, null);
}

export function createFiberFromElement(element: ReactElement) {
    const { type, key } = element;
    const pendingProps = element.props;
    return createFiberFromTypeAndProps(type, key, pendingProps);
}

export function createFiberFromTypeAndProps(type: any, key: string | null, pendingProps: any) {
    let fiberTag = IndeterminateComponent;
    // 如果是字符串则为原生标签
    if (isStr(type)) {
        fiberTag = HostComponent;
    }

    const fiber = createFiber(fiberTag, pendingProps, key);
    fiber.elementType = type;
    fiber.type = type;

    return fiber;
}

/**
 * 为每个 current fiber node 创建对应的 workInProgress fiber node
 */
export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
    let workInProgress = current.alternate;

    if (workInProgress === null) {
        workInProgress = createFiber(current.tag, pendingProps, current.key);
        workInProgress.elementType = current.elementType;
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;

        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        workInProgress.pendingProps = pendingProps;
        // Needed because Blocks store data on type.
        workInProgress.type = current.type;

        // 已经有 alternate 缓存，重置 Effect 标识
        workInProgress.flags = current.flags;
    }

    // 暂不实现
    // Reset all effects except static ones.
    // Static effects are not specific to a render.
    // workInProgress.flags = current.flags & StaticMask;
    workInProgress.flags = current.flags;

    workInProgress.child = current.child;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.memoizedProps = current.memoizedProps;

    // 这些将在父级协调期间被覆盖
    workInProgress.sibling = current.sibling;
    workInProgress.index = current.index;

    return workInProgress;
}
