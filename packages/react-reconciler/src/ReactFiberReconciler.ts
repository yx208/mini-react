import type { FiberRoot } from "./ReactInternalTypes";
import type { ReactNodeList } from "shared/ReactTypes";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

export function updateContainer(element: ReactNodeList, container: FiberRoot) {
    const current = container.current;
    current.memoizedState = { element };

    scheduleUpdateOnFiber(container, current);
}
