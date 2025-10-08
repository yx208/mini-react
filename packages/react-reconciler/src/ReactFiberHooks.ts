import ReactSharedInternals from "shared/ReactSharedInternals";
import { type Dispatcher, Fiber, type FiberRoot } from "./ReactInternalTypes";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { HostRoot } from "./ReactWorkTags";

let currentHook: Hook | null = null;
// 当前正在处理中的 Hook
let workInProgressHook: Hook | null = null;
// 当前正在执行渲染的 Fiber 节点
let currentlyRenderingFiber: Fiber | null = null;

type Hook = {
    memoizedState: any,
    baseState: any,
    // baseQueue: null;
    // queue: any;
    next: Hook | null,
};

type Dispatch<A> = (action: A) => void;

/**
 * 挂载阶段，连接 hook
 */
function mountWorkInProgressHook() {
    const hook: Hook = {
        memoizedState: null,
        baseState: null,
        next: null,
    };

    if (workInProgressHook === null) {
        // 第一个 hook
        currentlyRenderingFiber!.memoizedState = workInProgressHook = hook;
    } else {
        // 后面的 hook
        workInProgressHook = workInProgressHook.next = hook;
    }

    return workInProgressHook;
}

// function updateWorkInProgressHook() {
//     const current = currentlyRenderingFiber.alternate;
//     // 更新阶段
//     if (current !== null) {
//         currentlyRenderingFiber.memoizedState = current.memoizedState;
//         if (workInProgressHook !== null) {
//             // 追加
//         } else {
//             // 第一个 hook
//
//         }
//     } else {
//         // 挂载阶段
//         const hook: Hook = {
//             memoizedState: null,
//             baseState: null,
//             next: null,
//         };
//
//         if (workInProgressHook !== null) {
//             // 并非第一个 hook，加到尾部
//             workInProgressHook = workInProgressHook.next = hook;
//         } else {
//             // 第一个 hook，挂到 Fiber 中
//             workInProgressHook = currentlyRenderingFiber.memoizedState = hook;
//         }
//     }
//
//     return workInProgressHook;
// }

/**
 * 创建返回 workInProgressHook，这个函数同时处理 mount 与 update 两个阶段
 * 但 mount 阶段是创建跟连接 hook 链表，update 阶段可以复用老的
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

        // 头节点
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

function mountReducer<S, I, A>(
    reducer: (state: S, action: A) => S,
    initialArg: I,
    init?: (state: I) => S
): [S, Dispatch<A>] {
    // 1 创建连接 hook
    const hook = mountWorkInProgressHook();

    // 2 状态初始值
    let initialState: S;
    if (typeof init === "function") {
        initialState = init(initialArg);
    } else {
        initialState = initialArg as unknown as S;
    }

    // 3 更新 hook
    hook.memoizedState = hook.baseState = initialState;

    // 4 创建 dispatch 函数
    const dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber!, hook, reducer as any);

    return [initialState, dispatch];
}

function updateReducer<S, I, A>(
    reducer: (value: S, a: A) => S,
    _initialArg: I,
    _init?: (initState: I) => S,
): [S, Dispatch<A>] {
    const hook = updateWorkInProgressHook();
    const dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber!, hook, reducer as any);

    return [hook.memoizedState, dispatch];
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

function dispatchReducerAction<S, A>(
    fiber: Fiber,
    hook: Hook,
    reducer: (state: S, action: A) => S,
    action: any,
) {
    // 兼容 useState
    hook.memoizedState = reducer ? reducer(hook.memoizedState, action) : action;

    fiber.alternate = { ...fiber };

    const root = getRootForUpdateFiber(fiber);
    if (root !== null) {
        scheduleUpdateOnFiber(root, fiber);
    }
}

function getRootForUpdateFiber(sourceFiber: Fiber): FiberRoot | null {
    let node = sourceFiber;
    let parent = node.return;
    while (parent !== null) {
        node = parent;
        parent = node.return;
    }

    return node.tag === HostRoot ? node.stateNode : null;
}

function finishRenderingHooks() {
    // 我们可以假设之前的调度器始终是当前这个，因为我们在渲染阶段开始时就设置了它，且不存在重新进入的情况
    // ReactSharedInternals.Hooks = ContextOnlyDispatcher;

    currentlyRenderingFiber = null;
    currentHook = null;
    workInProgressHook = null;

    ReactSharedInternals.H = ContextOnlyDispatcher;
}

function throwInvalidHookError() {
    throw new Error(
        'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
        ' one of the following reasons:\n' +
        '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
        '2. You might be breaking the Rules of Hooks\n' +
        '3. You might have more than one copy of React in the same app\n' +
        'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.',
    );
}

const ContextOnlyDispatcher = {
    useReducer: throwInvalidHookError
} as unknown as Dispatcher;

// mount 阶段所需 hook
const HooksDispatcherOnMount: Dispatcher = {
    useReducer: mountReducer
};

// update 阶段所需 hook
const HooksDispatcherOnUpdate: Dispatcher = {
    useReducer: updateReducer
};

export {
    mountWorkInProgressHook,
    updateWorkInProgressHook,
    renderWithHooks,
};
