import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import type { ReactElement } from "shared/ReactElementType";
import { Fiber } from "./ReactInternalTypes";
import { Placement } from "./ReactFiberFlags";
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from "./ReactFiber";

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);

/**
 * @param shouldTrackSideEffects - 用来区分组件是首次挂载（mount:false）还是更新（update:true）
 */
function ChildReconciler(shouldTrackSideEffects: boolean) {
    /**
     * 我们目前在这里将 sibling 设置为 null，索引设置为 0，因为在返回它之前很容易忘记执行。例如单个子元素的情况
     */
    function useFiber(fiber: Fiber, pendingProps: any): Fiber {
        const clone = createWorkInProgress(fiber, pendingProps);
        clone.index = 0;
        clone.sibling = null;
        return clone;
    }

    /**
     * 它的主要作用是标记新创建的 Fiber 节点需要进行 DOM 插入操作
     *
     * 情况 1: 当首次挂在时(shouldTrackSideEffects=false)
     * 此时整个组件树都是新的, 会在 commit 阶段批量创建所有 DOM 节点, 因此不需要标记插入(Placement)
     *
     * 情况 2: 是一次更新操作(shouldTrackSideEffects=true)
     * 此时会检查 alternate, 如果不存在说明这是一个新建的节点, 此时需要添加标记, 需要在 commit 阶段插入这个节点到 DOM
     */
    function placeSingleChild(newFiber: Fiber) {
        if (shouldTrackSideEffects && newFiber.alternate === null) {
            newFiber.flags |= Placement;
        }
        return newFiber;
    }

    /**
     * 负责处理单个 ReactElement 的 diff 算法
     * 对比新的 ReactElement 与现有 Fiber, 决定是复用/更新, 还是创建新的 Fiber 节点
     *
     * @param returnFiber - 当前处理的 Fiber, 相对于 currentFirstChild 为 parent(returnFiber)
     * @param currentFirstChild - 在挂在阶段 这个是为 null
     * @param element - 新的元素（单个）
     */
    function reconcileSingleElement(returnFiber: Fiber, currentFirstChild: Fiber | null, element: ReactElement) {
        // 复用条件：1 同一层级，2 key 相同，3 类型相同
        // currentFirstChild 是 parentFiber 的子级第一个元素，从里开始搜索同一层级(已满足第一条件)
        const key = element.key;
        let child = currentFirstChild;
        while (child !== null) {
            // 第二条件
            if (child.key === key) {
                const elementType = element.type;
                // 第三条件
                if (child.elementType === elementType) {
                    // 因为是单个子元素，找到了之后其他的节点应该删除

                    const existing = useFiber(child, element.props);
                    existing.return = returnFiber;
                    return existing;
                } else {
                    break;
                }
            } else {
                // 因为是单个子元素，所以其他的节点应该删除
                // delete
            }

            child = child.sibling;
        }

        // 创建
        const nextChildFiber = createFiberFromElement(element);
        nextChildFiber.return = returnFiber;
        return nextChildFiber;
    }

    function createChild(returnFiber: Fiber, newChild: any): Fiber | null {
        const newChildType = typeof newChild;

        if ((newChildType === "string" && newChild !== "") || newChildType === "number") {
            const created = createFiberFromText(newChild + "");
            created.return = returnFiber;
            return created;
        }

        if (newChildType === "object" && newChildType !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    const created = createFiberFromElement(newChild);
                    created.return = returnFiber;
                    return created;
                }
            }

            if (Array.isArray(newChild)) {
                return null;
            }
        }

        return null;
    }

    /**
     * 节点有多个子元素（Array）
     * 返回协调完毕的子元素数组的第一个元素的 Fiber
     * @param parentFiber
     * @param currentFirstChild
     * @param newChildren - 多个新子元素
     */
    function reconcileChildrenArray(
        parentFiber: Fiber,
        currentFirstChild: Fiber | null,
        newChildren: Array<any>
    ) {
        const oldFiber = currentFirstChild;
        let newIndex = 0;
        let previousNewFiber: Fiber | null = null;
        let resultingFirstChild: Fiber | null = null;

        // 挂载
        if (oldFiber === null) {
            for (; newIndex < newChildren.length; newIndex++) {
                const newFiber = createChild(parentFiber, newChildren[newIndex]);
                if (newFiber === null) {
                    continue;
                }

                // 在更新阶段用于判断元素位置是否发生变化，有变化则需要移动
                newFiber.index = newIndex;

                // 第一个成功构建的子元素
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber;
                } else {
                    // 相邻节点
                    previousNewFiber.sibling = newFiber;
                }

                previousNewFiber = newFiber;
            }
        }

        return resultingFirstChild;
    }

    function reconcileSingleTextNode(returnFiber: Fiber, currentFirstChild: Fiber | null, textContext: string) {
        // 无需检查文本节点上的键，因为我们没有办法定义它们。
        if (currentFirstChild !== null) {
            // todo
        }

        const created = createFiberFromText(textContext);
        created.return = returnFiber;
        return created;
    }

    /**
     * @param returnFiber - 协调节点的父节点（WorkInProgress）
     * @param currentFirstChild - 要协调的节点（当前页面显示中的，如果页面没有则是 null）
     * @param newChild
     */
    function reconcileChildFibers(returnFiber: Fiber, currentFirstChild: Fiber | null, newChild: any) {
        const newChildType = typeof newChild;

        // 当 newChild 是一个非空的对象时, 有两种可能: 一个节点或者集合
        if (newChildType === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                // 单个节点
                case REACT_ELEMENT_TYPE:
                    return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild));
            }

            if (Array.isArray(newChild)) {
                return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
            }
        }

        // 内容是文本
        if ((newChildType === "string" && newChild !== "") || newChildType === "number") {
            return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, newChild + ""));
        }

        return null;
    }

    return reconcileChildFibers;
}
