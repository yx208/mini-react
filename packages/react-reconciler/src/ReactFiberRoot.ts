import { createFiber } from "./ReactFiber";
import type { Container, Fiber, FiberRoot } from "./ReactInternalTypes";
import { HostRoot } from "./ReactWorkTags";

export function createFiberRoot(containerInfo: Container): FiberRoot {
    const root = new FiberRootNode(containerInfo);
    const uninitializedFiber = createHostRootFiber();
    // 根节点是一个原生节点元素，也需要一个 Fiber 节点表示
    root.current = uninitializedFiber;
    // 而 Root 的 Fiber 的 stateNode 需要保存 FiberRoot
    uninitializedFiber.stateNode = root;

    return root as FiberRoot;
}

function createHostRootFiber() {
    return createFiber(HostRoot, null, null);
}

export class FiberRootNode {
    containerInfo: Container;
    current: Fiber | null;
    finishedWork: Fiber | null;

    constructor(containerInfo: Container) {
        this.containerInfo = containerInfo;
        this.current = null;
        this.finishedWork = null;
    }
}
