// 上一个处理中的 Hook
import { Fiber } from "./ReactInternalTypes";

let currentHook: Hook | null = null;
// 当前正在处理中的 Hook
let workInProgressHook: Hook | null = null;
// 当前正在执行渲染的 Fiber 节点
const currentlyRenderingFiber: Fiber | null = null;

export type Hook = {
    memoizedState: any,
    baseState: any,
    // baseQueue: null;
    // queue: any;
    next: Hook | null,
};

function mountWorkInProgressHook() {

}

/**
 * 确定更新阶段当前要处理的 Hook
 *
 * 此函数既用于更新，也用于由渲染阶段更新触发的重新渲染。
 * 它假设存在可供克隆的当前钩子，或可作为基础的先前渲染通道中正在处理的钩子。
 */
function updateWorkInProgressHook() {
    // 确定 WIP hook 与之对应的 current hook
    let nextCurrentHook: Hook | null = null;
    // 如果当前没有工作中的 Fiber，说明说这是函数组件中的第一个 Hook
    if (currentHook === null) {
        const current = currentlyRenderingFiber.alternate;
        if (current !== null) {
            nextCurrentHook = current.memoizedState;
        }
    } else {
        nextCurrentHook = currentHook.next;
    }

    // 确定当前要处理的 hook
    let nextWorkInProgressHook: Hook | null;
    if (workInProgressHook === null) {
        nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
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

            const currentFiber = currentlyRenderingFiber.alternate;
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
            currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
        } else {
            // Append to the end of the list.
            // 加到链表尾部
            workInProgressHook = workInProgressHook.next = newHook;
        }
    }

    return workInProgressHook;
}

export {
    mountWorkInProgressHook,
    updateWorkInProgressHook
};
