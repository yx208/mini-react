import { createFiber } from "./ReactFiber";
import { Container, Fiber, FiberRoot } from "./ReactInternalTypes";
import { WorkTag } from "./ReactWorkTags";

export function createFiberRoot(containerInfo: Container): FiberRoot {
    const root: FiberRoot = new FiberRootNode(containerInfo);
    // 根节点是一个原生节点元素，也需要一个 Fiber 节点表示
    const uninitializedFiber = createFiber(WorkTag.HostRoot, null, null);
    root.current = uninitializedFiber;

    // 而 Root 的 Fiber 的 stateNode 需要保存 FiberRoot
    uninitializedFiber.stateNode = root;

    return root;
}

class FiberRootNode {
    containerInfo: Container;
    current: Fiber | null;
    finishedWork: Fiber | null;

    constructor(root: Container) {
        this.containerInfo = root;
        this.current = null;
        this.finishedWork = null;
    }
}
