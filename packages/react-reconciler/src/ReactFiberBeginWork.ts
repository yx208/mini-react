import { Fiber } from "./ReactInternalTypes";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import { ClassComponent, Fragment, FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";

/**
 * 从上到下遍历，创建/更新 Fiber 节点
 * @return {Fiber} - 返回调和(reconcile)完毕的子节点
 */
export function beginWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
    switch (workInProgress.tag) {
        case HostRoot:
            return updateHostRoot(current, workInProgress);
        case HostComponent:
            return updateHostComponent(current, workInProgress);
        case HostText:
            return updateHostText();
        case Fragment:
            return updateFragment(current, workInProgress);
        case ClassComponent:
            return updateClassComponent(current, workInProgress);
        case FunctionComponent:
            return updateFunctionComponent(current, workInProgress);
    }

    throw new Error(
        `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
        'React. Please file an issue.',
    );
}

function updateFunctionComponent(current: Fiber | null, workInProgress: Fiber) {
    const unresolvedProps = workInProgress.pendingProps;
    const Component = workInProgress.type;
    const nextChildren = Component(unresolvedProps);

    reconcileChildren(current, workInProgress, nextChildren);

    return workInProgress.child;
}

function updateClassComponent(current: Fiber | null, workInProgress: Fiber) {
    const Component = workInProgress.type;
    const unresolvedProps = workInProgress.pendingProps;

    const instance = new Component(unresolvedProps);
    const nextChildren = instance.render();

    reconcileChildren(current, workInProgress, nextChildren);

    return workInProgress.child;
}

function updateFragment(current: Fiber | null, workInProgress: Fiber) {
    const nextChildren = workInProgress.pendingProps.children;
    reconcileChildren(current, workInProgress, nextChildren);

    return workInProgress.child;
}

/**
 * 根节点的内容是文本
 */
function updateHostText() {
    return null;
}

/**
 * Root Fiber
 */
function updateHostRoot(current: Fiber | null, workInProgress: Fiber) {
    // 在前面 updateContainer 中把用户编写的 ReactNodeList 添加到了 memoizedState 的 element 属性中
    // 现在把它取出来进行 reconcile
    const nextChildren = workInProgress.memoizedState.element;

    reconcileChildren(current, workInProgress, nextChildren);

    if (current) {
        current.child = workInProgress.child;
    }

    return workInProgress.child;
}

/**
 * HTML 标签
 */
function updateHostComponent(current: Fiber | null, workInProgress: Fiber) {
    // 如果标签内容只有文本，则不会生成子节点（创建新 Fiber），内容当成标签的属性
    const isDirectTextChild = shouldSetTextContent(workInProgress.type, workInProgress.pendingProps);
    if (isDirectTextChild) {
        // 文本子节点
        return null;
    }

    const nextChildren = workInProgress.pendingProps.children;
    reconcileChildren(current, workInProgress, nextChildren);

    return workInProgress.child;
}

/**
 * 协调子节点
 *
 * mountChildFibers：在 mount 阶段，不需要标记副作用（side effects），因为整个子树都是新的
 * reconcileChildFibers：在 update 阶段，需要通过 diff 算法比较新旧子节点，标记哪些需要更新、删除或移动
 * Note: 需要注意的是，RootFiber 第一次渲染也是有 current 的，其他子节点第一次没有
 * @param current - current fiber, 页面中看到的 fiber 状态
 * @param workInProgress - 经过更新的 fiber 节点, 将是页面的下一个状态
 * @param nextChildren - 对于这个函数来说并不知道传进来的子节点是什么类型; text/jsx/Fiber
 */
function reconcileChildren(current: Fiber | null, workInProgress: Fiber, nextChildren: any) {
    if (current === null) {
        // 如果这是一个尚未渲染的全新组件，我们将不通过施加 side-effects 来更新其子节点集合
        // 相反，我们会将其全部添加到子节点中，再进行渲染。这意味着我们可以通过不追踪副作用来优化此协调过程
        // 如果这是一个新的组件（mount 阶段），对于新挂载的组件不需要跟踪副作用
        workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
    } else {
        // Root 节点第一次也是走更新
        // 如果是更新现有组件（update 阶段），需要跟踪副作用以便知道哪些 DOM 需要更新
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
