import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import type { ReactElement } from "shared/ReactElementType";
import { isNotEmptyString, isNumber } from "shared/utils";
import { Fiber } from "./ReactInternalTypes";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from "./ReactFiber";
import { HostText } from "./ReactWorkTags";

type ReconcilerFn = (returnFiber: Fiber, currentFirstFiber: Fiber | null, newChild: any) => Fiber | null;

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);

/**
 * @param shouldTrackSideEffects - 用来区分组件是首次挂载（mount:false）还是更新（update:true）
 */
function ChildReconciler(shouldTrackSideEffects: boolean): ReconcilerFn {
    /**
     * 我们目前在这里将 sibling 设置为 null，索引设置为 0，因为在返回它之前很容易忘记执行。例如单个子元素的情况
     * @return {Fiber} - WorkInProgress Fiber
     */
    function useFiber(fiber: Fiber, pendingProps: any): Fiber {
        const clone = createWorkInProgress(fiber, pendingProps);
        // 进入这个函数就代表着需要复用 Fiber，而 index 是位置相关信息，复用节点的时旧的位置已经是失效了
        // 置为 0 之后会在 reconcileChildrenArray 中重新赋值为有效的值
        // tip: index 字段是 Fiber 节点在父节点的子元素列表中的位置索引
        clone.index = 0;
        clone.sibling = null;
        return clone;
    }

    /**
     * 标记删除元素
     */
    function deleteChild(returnFiber: Fiber, child: Fiber) {
        // 初次渲染
        if (!shouldTrackSideEffects) {
            return;
        }

        if (returnFiber.deletions === null) {
            returnFiber.deletions = [child];
            returnFiber.flags |= ChildDeletion;
        } else {
            returnFiber.deletions.push(child);
        }
    }

    /**
     * 从某个 Fiber 开始删除链表中剩余的元素
     */
    function deleteRemainingChildren(returnFiber: Fiber, currentFirstChild: Fiber | null) {
        // 初次渲染
        if (!shouldTrackSideEffects) {
            return;
        }

        let childToDelete = currentFirstChild;
        while (childToDelete !== null) {
            deleteChild(returnFiber, childToDelete);
            childToDelete = childToDelete.sibling;
        }

        return null;
    }

    /**
     * 放置子元素
     * 把 newFiber 放置到 newIndex 位置
     */
    function placeChild(newFiber: Fiber, lastPlacedIndex: number, newIndex: number): number {
        newFiber.index = newIndex;

        // 非更新阶段，即初次渲染
        if (!shouldTrackSideEffects) {
            return lastPlacedIndex;
        }

        const current = newFiber.alternate;
        // 有旧的 Fiber
        if (current !== null) {
            // old: [A B C]
            // new: [A C B]

            const oldIndex = current.index;
            if (oldIndex < lastPlacedIndex) {
                newFiber.flags |= Placement;
                return lastPlacedIndex;
            } else {
                return oldIndex;
            }
        } else {
            // 非页面初次渲染的新建的节点；没有 currentFiber 也就是没有旧的位置
            newFiber.flags |= Placement;
            return lastPlacedIndex;
        }
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
                    // key 相同但类型不同；说明已经没有节点可以复用（同一层级不能有重复的 key）
                    // 删除后面剩余的所有元素（包括 child）
                    deleteRemainingChildren(returnFiber, child);
                    break;
                }
            } else {
                // 因为是单个子元素协调，所以其他的节点应该删除
                deleteChild(returnFiber, child);
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
     * 对于子元素是文本；返回一个有效的 Fiber 节点；无论是复用或创建
     */
    function updateTextNode(returnFiber: Fiber, current: Fiber | null, textContent: string): Fiber {
        // 没有老节点或者老节点不是文本节点
        if (current === null || current.tag !== HostText) {
            // 没法复用，创建一个
            const created = createFiberFromText(textContent);
            created.return = returnFiber;
            return created;
        } else {
            // 老节点也是文本，update
            const existing = useFiber(current, textContent);
            existing.return = returnFiber;
            return existing;
        }
    }

    /**
     * 对于子元素是 ReactElement；返回一个有效的 Fiber 节点；无论是复用或创建。
     *
     * 进到这个函数的情况下说明相同位置下 key 一致，那么有以下情况。
     *
     * 1 相同位置下 key 一致且‘有’ current fiber，并且类型也相同，那么直接复用；即 div -> div，完美条件。
     *
     * 2 相同位置下 key 一致且‘有’ current fiber，但类型不一致那么创建一个新的 fiber
     *      即：{<div> div ... </div>} -> {<div> span ... </div>}
     *
     * 3 相同位置下 key 一致但‘没有’ current fiber
     */
    function updateElement(returnFiber: Fiber, current: Fiber | null, element: ReactElement): Fiber {
        if (current !== null) {
            // Fiber 复用条件之二：类型相同
            const elementType = element.type;
            if (current.elementType === elementType) {
                const existing = useFiber(current, element.props);
                existing.return = returnFiber;
                return existing;
            }
        }

        // 没法复用；type 不同直接替换
        const created = createFiberFromElement(element);
        created.return = returnFiber;
        return created;
    }

    /**
     * @return - 返回 null 表示无法复用
     */
    function updateSlot(returnFiber: Fiber, oldFiber: Fiber | null, newChild: any): Fiber | null {
        // 如果键匹配则更新 Fiber，否则返回 null

        const key = oldFiber === null ? null : oldFiber.key;
        // 新节点是文本子节点
        if (isNotEmptyString(newChild) || isNumber(newChild)) {
            // 文本节点没有 key，如果前一个节点隐含 key 值，即使它不是文本节点，我们也可以继续替换它，而不会中止
            // 即：新节点是文本，老节点不是文本节点
            if (key !== null) {
                return null;
            }

            return updateTextNode(returnFiber, oldFiber, newChild + "");
        }

        // ReactElement 类型
        if (typeof newChild === "object" && newChild !== null) {
            // Fiber 复用条件之一：key 相同
            if (newChild.key === key) {
                return updateElement(returnFiber, oldFiber, newChild);
            } else {
                // key 不相同不能复用
                return null;
            }
        }

        return null;
    }

    /**
     * 节点有多个子元素（Array）
     * 返回协调完毕的子元素数组的第一个元素的 Fiber
     *
     * @reference 参阅: https://jser.dev/react/2022/02/08/the-diffing-algorithm-for-array-in-react
     *
     * @param returnFiber
     * @param currentFirstChild
     * @param newChildren - ReactElement 或者文本内容
     */
    function reconcileChildrenArray(returnFiber: Fiber, currentFirstChild: Fiber | null, newChildren: any[]): Fiber | null {
        // 由于 Fiber 上没有后指针，该算法无法通过两端搜索进行优化。我正尝试评估该模型能达到的极限。
        // 若权衡后发现得不偿失，可后续再添加该功能
        // This algorithm can't optimize by searching from both ends since we
        // don't have back-pointers on fibers. I'm trying to see how far we can get
        // with that model. If it ends up not being worth the tradeoffs, we can
        // add it later.

        // 即便采用双向优化，我们仍应优先优化变化较少的情况，此时应采用暴力比较而非调用 Map。
        // 我倾向于在仅前向模式下优先探索该路径，仅当发现需要大量前瞻操作时才启用 Map。
        // 虽然这种方式处理反转操作的效果不如双向搜索，但反转情况较为罕见。此外，要在可迭代对象上实现双向优化，需要复制整个集合。
        // Even with a two ended optimization, we'd want to optimize for the case
        // where there are few changes and brute force the comparison instead of
        // going for the Map. It'd like to explore hitting that path first in
        // forward-only mode and only go for the Map once we notice that we need
        // lots of look ahead. This doesn't handle reversal as well as two ended
        // search but that's unusual. Besides, for the two ended optimization to
        // work on Iterables, we'd need to copy the whole set.

        // 本次迭代中，我们将接受每次插入/移动操作都触发最差情况（将所有元素添加到Map中）
        // In this first iteration, we'll just live with hitting the bad case
        // (adding everything to a Map) in for every insert/move.

        // 若修改此代码，请同步更新采用相同算法的 reconcileChildrenIterator() 函数。
        // If you change this code, also update reconcileChildrenIterator() which
        // uses the same algorithm.

        let oldFiber = currentFirstChild;
        let newIndex = 0;
        // 上一个 Fiber 在老 Fiber 上的位置
        let lastPlacedIndex = 0;
        let previousNewFiber: Fiber | null = null;
        let resultingFirstChild: Fiber | null = null;
        let nextOldFiber: Fiber | null = null;

        // 分阶段处理 - 两轮遍历

        // 第一轮 - 处理更新的节点
        // 情况一：从前往后遍历，按照位置一对一比较，遇到不能复用的节点就停止本轮遍历
        for (; oldFiber !== null && newIndex < newChildren.length; newIndex++) {
            // 这个条件用于检测在列表更新时，旧节点是否需要向左移动
            // old: [A B C]
            // new: [A C B]
            // 假设此时 newIndex = 1, oldFiber = B(1)，此时条件不成立 newIndex = (old(B) -> 1)
            if (oldFiber.index > newIndex) {
                nextOldFiber = oldFiber;
                oldFiber = null;
            } else {
                nextOldFiber = oldFiber.sibling;
            }

            // 尝试复用节点
            const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIndex]);
            // 没法复用跳过这一个轮遍历
            if (newFiber === null) {
                // 此逻辑在遇到空槽位（如空子节点）时会失效。也就是触发了第一个判断逻辑，index 不连续
                // 这很糟糕，因为它会始终触发慢速路径。我们需要更优的机制来区分这是查找失败还是空值、布尔值、未定义等情况。
                if (oldFiber === null) {
                    oldFiber = nextOldFiber;
                }
                break;
            }

            // todo: 下面代码在节点可以复用的情况下运行

            // 只在更新阶段执行（非首次挂载）
            if (shouldTrackSideEffects) {
                if (oldFiber && newFiber?.alternate === null) {
                    // 我们匹配了 slot，但我们没有重用现有的 Fiber，因此我们需要删除现有的子光纤。
                    deleteChild(returnFiber, oldFiber);
                }
            }

            // 判断节点在 DOM 的相对位置是否发生变化

            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);

            // 第一个元素，子元素 Fiber 链表头节点
            if (previousNewFiber === null) {
                resultingFirstChild = newFiber;
            } else {
                // 添加 Fiber 到链表尾部
                previousNewFiber.sibling = newFiber;
            }

            previousNewFiber = newFiber;
            oldFiber = nextOldFiber;
        }

        // 情况二：新节点已经没有，但还有多余的旧节点，那么可以删除旧的其他节点，然后结束
        if (newIndex === newChildren.length) {
            deleteRemainingChildren(returnFiber, oldFiber);
            return resultingFirstChild;
        }

        // 情况三：旧的节点已经没有了，但还有新的节点没处理完，那么直接添加
        // tip: 页面初次渲染上面的步骤都不成立，只会走这里
        if (oldFiber === null) {
            for (; newIndex < newChildren.length; newIndex++) {
                const newFiber = createChild(returnFiber, newChildren[newIndex]);
                if (newFiber === null) {
                    continue;
                }

                lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIndex);
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber;
                } else {
                    previousNewFiber.sibling = newFiber;
                }

                previousNewFiber = newFiber;
            }

            return resultingFirstChild;
        }

        // Add all children to a key map for quick lookups.
        // const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

        for (; newIndex < newChildren.length; newIndex++) {
            // updateFromMap();
        }

        if (shouldTrackSideEffects) {
            // existingChildren.forEach(child => deleteChild(returnFiber, child));
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
     * 所谓协调复用，主要指复用 Fiber，然后带来 DOM 复用
     * 对于 Fiber 的复用主要是更新 Fiber 的属性，而不创建一个新的 Fiber
     *
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

// function throwOnInvalidObjectType(newChild: object) {
//     const childString = Object.prototype.toString.call(newChild);
//
//     throw new Error(
//         `Objects are not valid as a React child (found: ${
//             childString === '[object Object]'
//                 ? 'object with keys {' + Object.keys(newChild).join(', ') + '}'
//                 : childString
//         }). ` +
//         'If you meant to render a collection of children, use an array ' +
//         'instead.',
//     );
// }
