import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { ReactElement } from "shared/ReactElementType";
import { Fiber } from "./ReactInternalTypes";
import { Flags } from "./ReactFiberFlags";
import { createFiberFromElement } from "./ReactFiber";

export const reconcileChildFibers = createChildReconciler(true);
export const mountChildFibers = createChildReconciler(false);

function createChildReconciler(shouldTrackSideEffects: boolean) {
    /**
     * 给 Fiber 添加 flag
     */
    function placeSingleChild(newFiber: Fiber) {
        // 对于只有一个子元素的情况来说，这更简单。我们只需要做一个插入新子元素的位置
        if (shouldTrackSideEffects && newFiber.alternate === null) {
            newFiber.flags |= Flags.Placement;
        }
        return newFiber;
    }

    /**
     * 协调单个子节点（暂实现创建）
     */
    function reconcileSingleElement(parentFiber: Fiber, currentFirstChild: Fiber | null, element: ReactElement) {
        const created = createFiberFromElement(element);
        created.return = parentFiber;
        return created;
    }

    /**
     * @param parentFiber - 协调节点的父节点
     * @param currentFirstChild - 要协调的节点
     * @param newChild
     */
    function reconcileChildFibers(parentFiber: Fiber, currentFirstChild: Fiber | null, newChild: any) {
        const childType = typeof newChild;
        // 对不同子节点类型做不同处理（eg: 单个节点, 文本, 对象, 数组）
        if (childType === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    return placeSingleChild(
                        reconcileSingleElement(parentFiber, currentFirstChild, newChild)
                    );
            }
        }

        return null;
    }

    return reconcileChildFibers;
}
