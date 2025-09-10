import { Fiber } from "./ReactInternalTypes";
import { WorkTag } from "./ReactWorkTags";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";

/**
 * 从上到下遍历，创建/更新 Fiber 节点
 */
export function beginWork(current: Fiber, workInProgress: Fiber): Fiber | null {
    switch (workInProgress.tag) {
        case WorkTag.HostRoot:
            return updateHostRoot(current, workInProgress);
        case WorkTag.HostComponent:
            return updateHostComponent(current, workInProgress);
    }

    throw new Error(
        `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
        'React. Please file an issue.',
    );
}

/**
 * Root Fiber
 */
function updateHostRoot(current: Fiber | null, workInProgress: Fiber) {
    const nextChildren = workInProgress.memoizedState.element;

    reconcileChildren(current, workInProgress, nextChildren);

    return workInProgress.child;
}

/**
 * HTML 标签
 */
function updateHostComponent(current: Fiber | null, workInProgress: Fiber) {
    // 如果标签内容只有文本，则不会生成子节点（创建新 Fiber），内容当成标签的属性
    const nextChildren = workInProgress.pendingProps.children;
    const isDirectTextChild = shouldSetTextContent(workInProgress.type, workInProgress.pendingProps);
    if (isDirectTextChild) {
        // 文本子节点
        return null;
    }

    reconcileChildren(current, workInProgress, nextChildren);

    return workInProgress.child;
}

/**
 * 协调子节点
 */
function reconcileChildren(current: Fiber | null, workInProgress: Fiber, nextChildren: any) {
    // 没有旧 Fiber 则为第一次渲染
    if (current === null) {
        // 初次挂载节点
        workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
    } else {
        // 更新
        workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren);
    }
}

/**
 * 判断是否为文本节点
 */
export function shouldSetTextContent(type: string, props: any) {
    return (
        type === 'textarea' ||
        type === 'noscript' ||
        typeof props.children === 'string' ||
        typeof props.children === 'number' ||
        (typeof props.dangerouslySetInnerHTML === 'object' &&
            props.dangerouslySetInnerHTML !== null &&
            props.dangerouslySetInnerHTML.__html != null)
    );
}
