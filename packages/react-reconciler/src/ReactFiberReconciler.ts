import type { FiberRoot } from "./ReactInternalTypes";
import type { ReactNodeList } from "shared/ReactTypes";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

/**
 * updateContainer 是一个在 React 代码库中被多次调用的函数
 * 你可能会疑惑：为什么它被命名为 update 而不是 render 甚至 mount？
 * 这是因为 React 始终将树视作处于更新状态。React 能同时识别树中正在挂载的部分，并每次执行必要的代码。
 */
export function updateContainer(element: ReactNodeList, container: FiberRoot) {
    // 获取 current 树
    const current = container.current;
    current.memoizedState = { element };

    // 调度更新
    scheduleUpdateOnFiber(container, current);
}
