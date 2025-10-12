import type { Container, Fiber, FiberRoot } from "./ReactInternalTypes";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import { Fragment, FunctionComponent, HostComponent, HostPortal, HostRoot, HostText } from "./ReactWorkTags";

/**
 * 提交改变的副作用
 */
export function commitMutationEffects(root: FiberRoot, finishedWork: Fiber) {
    commitMutationEffectsOnFiber(root, finishedWork);
}

/**
 * 递归遍历副作用，从树的底部左叶子开始处理
 */
function commitMutationEffectsOnFiber(root: FiberRoot, finishedWork: Fiber) {
    recursivelyTraverseMutationEffects(root, finishedWork);
    commitReconciliationEffects(finishedWork);
}

/**
 * 递归遍历副作用
 */
function recursivelyTraverseMutationEffects(root: FiberRoot, parentFiber: Fiber) {
    let child = parentFiber.child;
    while (child !== null) {
        commitMutationEffectsOnFiber(root, child);
        child = child.sibling;
    }
}

/**
 * 处理调和产生的 effects, 这里的 effects 是调和产生的 flags
 * 注意 effect 可以同时是多个
 */
function commitReconciliationEffects(finishedWork: Fiber) {
    const flags = finishedWork.flags;

    // 新增
    if (flags & Placement) {
        commitPlacement(finishedWork);
        finishedWork.flags &= ~Placement;
    }

    // 删除
    if (flags & ChildDeletion) {
        const parentFiber = isHostParent(finishedWork)
            ? finishedWork
            : getHostParentFiber(finishedWork);
        commitDeletions(parentFiber, finishedWork.deletions!);

        finishedWork.flags &= ~ChildDeletion;
        finishedWork.deletions = null;
    }
}

/**
 * 删除
 */
function commitDeletions(parentFiber: Fiber, deletions: Fiber[]) {
    const dom = parentFiber.stateNode;
    deletions.forEach(deletionFiber => {
        dom.removeChild(getStateNode(deletionFiber));
    });
}

/**
 * 获取有 dom 节点的额 Fiber
 */
function getStateNode(fiber: Fiber) {
    let node = fiber;
    while (true) {
        if (isHost(node) && node.stateNode) {
            return node.stateNode;
        }
        node = node.child!;
    }
}

/**
 * 处理新增
 */
function commitPlacement(finishedWork: Fiber) {
    switch (finishedWork.tag) {
        case FunctionComponent:
        case Fragment: {
            let kid = finishedWork.child;
            while (kid !== null) {
                commitPlacement(kid);
                kid = kid.sibling;
            }
            break;
        }
        case HostRoot: {
            // 原生节点才能插入元素(调用 appendChild)
            const parent = finishedWork.stateNode.containerInfo as Container;
            if (parent !== null) {
                parent.appendChild(finishedWork.stateNode);
            }
            break;
        }
        case HostText:
        case HostComponent: {
            const parentFiber = getHostParentFiber(finishedWork)!;
            const before = getHostSibling(finishedWork);

            if (parentFiber.tag === HostRoot) {
                const parent: Element = parentFiber.stateNode.containerInfo;
                insertOrAppendPlacementNode(finishedWork, before, parent);
            } else {
                const parent: Element = parentFiber.stateNode;
                insertOrAppendPlacementNode(finishedWork, before, parent);
            }
            break;
        }
        default:
            throw new Error(
                'Invalid host parent fiber. This error is likely caused by a bug ' +
                'in React. Please file an issue.',
            );
    }
}

function insertOrAppendPlacementNode(node: Fiber, before: Element | null, parent: Element) {
    if (before !== null) {
        parent.insertBefore(getStateNode(node), before);
    } else {
        parent.appendChild(getStateNode(node));
    }
}

/**
 * 寻找有 DOM 的 sibling 节点
 */
function getHostSibling(fiber: Fiber): HTMLElement | null {
    let node = fiber;
    sibling: while (true) {
        while (node.sibling === null) {
            if (node.return === null || isHostParent(node.return)) {
                return null;
            }

            node = node.return;
        }

        node.sibling.return = node.return;
        node = node.sibling;

        // 如果不是有效的 DOM 节点，意味着可能是函数组件、类组件之类的，则往里面找
        while (node.tag !== HostComponent && node.tag !== HostText) {
            // 这个节点会发生改动，位置不稳定
            if (node.flags & Placement) {
                continue sibling;
            }

            // 假如进入这个 while 的是个函数组件，那么它的子 fiber 可能是 DOM 元素
            // 当然，如果没有 child，那么必定没有 DOM 元素，因为函数组件本身 fiber 并不存在 DOM 元素
            if (node.child === null) {
                continue sibling;
            } else {
                // 那就继续往里面找
                node = node.child;
            }
        }

        // 过了上面的 while 意味着这是一个有 DOM 节点的 fiber
        // 当然，他也不能是一个将要移动的 Fiber
        if (!(node.flags & Placement)) {
            return node.stateNode;
        }
    }
}

/**
 * 查找最近的原生 DOM 节点 fiber
 * @param fiber
 */
function getHostParentFiber(fiber: Fiber): Fiber {
    let parent = fiber.return;
    while (parent !== null) {
        if (isHostParent(parent)) {
            return parent;
        }
        parent = parent.return;
    }

    throw new Error("Unknown host parent fiber.");
}

function isHost(fiber: Fiber): boolean {
    return fiber.tag === HostComponent || fiber.tag === HostText;
}

function isHostParent(fiber: Fiber): boolean {
    return (
        fiber.tag === HostComponent ||
        fiber.tag === HostRoot ||
        fiber.tag === HostPortal
    );
}

