import ReactSharedInternals from "shared/ReactSharedInternals";
import { type Dispatcher, Fiber } from "./ReactInternalTypes";

let currentHook: Hook | null = null;
// 当前正在处理中的 Hook
let workInProgressHook: Hook | null = null;
// 当前正在执行渲染的 Fiber 节点
let currentlyRenderingFiber: Fiber | null = null;

export type Hook = {
    memoizedState: any,
    baseState: any,
    // baseQueue: null;
    // queue: any;
    next: Hook | null,
};

export type Dispatch<A> = (action: A) => void;

const HooksDispatcherOnMount: Dispatcher = {
    useReducer: (() => {
        return [];
    }) as any
};

const HooksDispatcherOnUpdate: Dispatcher = {
    useReducer: updateReducer
};

function mountWorkInProgressHook() {

}

/**
 * 创建返回尾节点（WIP hook），跟 mount 阶段差不多
 * 但 mount 是纯粹的创建跟连接，update 阶段可以复用老的
 *
 * 此函数既用于更新，也用于由渲染阶段更新触发的重新渲染。
 * 它假设存在可供克隆的当前钩子，或可作为基础的先前渲染通道中正在处理的钩子。
 */
function updateWorkInProgressHook() {
    // 确定 WIP hook 与之对应的 current hook
    let nextCurrentHook: Hook | null = null;
    // 如果当前没有工作中的 Fiber，说明说这是函数组件中的第一个 Hook
    if (currentHook === null) {
        const current = currentlyRenderingFiber!.alternate;
        if (current !== null) {
            nextCurrentHook = current.memoizedState;
        }
    } else {
        nextCurrentHook = currentHook.next;
    }

    // 确定当前要处理的 hook
    let nextWorkInProgressHook: Hook | null;
    if (workInProgressHook === null) {
        nextWorkInProgressHook = currentlyRenderingFiber!.memoizedState;
    } else {
        nextWorkInProgressHook = workInProgressHook.next;
    }

    // 只在渲染中断后恢复时才可能进入 if 分支
    if (nextWorkInProgressHook !== null) {
        // 设置全局的变量
        workInProgressHook = nextWorkInProgressHook;
        // 指向下一个要处理的 WIP Hook
        // nextWorkInProgressHook = workInProgressHook.next;
        // 与 WIP hook 对应的 current hook
        currentHook = nextCurrentHook;
    } else {
        // 从 current hook 中复制 hook 链表
        // 组件更新时，React 会创建一个新的 workInProgress fiber
        // 这个新 fiber 的 memoizedState (Hook 链表) 初始是空的

        if (nextCurrentHook === null) {
            // 这种情况应该是一种 bug

            const currentFiber = currentlyRenderingFiber!.alternate;
            if (currentFiber === null) {
                // 这是初始渲染。当组件挂起、恢复，然后渲染另一个钩子时，就会到达此分支。
                // 此分支永远不应该到达，因为我们应该先切换到挂载调度器。
                throw new Error(
                    'Update hook called on initial render. This is likely a bug in React. Please file an issue.',
                );
            } else {
                // This is an update. We should always have a current hook.
                // 这是一次更新。但更新总会有一个 current hook
                throw new Error('Rendered more hooks than during the previous render.');
            }
        }

        currentHook = nextCurrentHook;

        // 通过 current hook 创建 WIP hook
        const newHook: Hook = {
            memoizedState: currentHook.memoizedState,
            baseState: currentHook.baseState,
            // baseQueue
            // queue
            next: null,
        };

        if (workInProgressHook === null) {
            // This is the first hook in the list.
            // 函数组件中的第一个 Hook
            currentlyRenderingFiber!.memoizedState = workInProgressHook = newHook;
        } else {
            // Append to the end of the list.
            // 加到链表尾部
            workInProgressHook = workInProgressHook.next = newHook;
        }
    }

    return workInProgressHook;
}

function updateReducer<S, A>(
    reducer: (value: S, a: A) => S,
) {
    const hook = updateWorkInProgressHook();
    return updateReducerImpl(hook, currentHook, reducer);
}

function updateReducerImpl<S, A>(
    hook: Hook,
    _current: Hook | null,
    _reducer: (state: S, action: A) => S
): [S, Dispatch<A>] {
    return [hook.memoizedState, () => {}];
}

function renderWithHooks<Props, SecondArg>(
    current: Fiber | null,
    workInProgress: Fiber,
    Component: (props: Props, arg: SecondArg) => any,
    props: Props,
    secondArg: SecondArg,
) {
    currentlyRenderingFiber = workInProgress;

    // 函数组件执行之前；hook 链表置为空，稍后再构建
    workInProgress.memoizedState = null;

    // 决定调用的 dispatcher
    ReactSharedInternals.H = current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;

    const children = Component(props, secondArg);

    // 组件执行之后；重置状态
    finishRenderingHooks();

    return children;
}

function finishRenderingHooks() {
    // 我们可以假设之前的调度器始终是当前这个，因为我们在渲染阶段开始时就设置了它，且不存在重新进入的情况
    // ReactSharedInternals.Hooks = ContextOnlyDispatcher;

    currentlyRenderingFiber = null;
    currentHook = null;
    workInProgressHook = null;

    ReactSharedInternals.H = null;
}

export {
    mountWorkInProgressHook,
    updateWorkInProgressHook,
    renderWithHooks,
};
