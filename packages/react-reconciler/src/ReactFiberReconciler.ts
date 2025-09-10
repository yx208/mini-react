import type { FiberRoot } from "./ReactInternalTypes";
import type { ReactNodeList } from "shared/ReactTypes";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

export function updateContainer(element: ReactNodeList, container: FiberRoot) {
    // 获取 current 树
    const current = container.current;
    current.memoizedState = { element };

    // 调度更新
    scheduleUpdateOnFiber(container, current);
}
