import type { Container, Fiber, FiberRoot } from "./ReactInternalTypes";
import { Placement } from "./ReactFiberFlags";
import {Fragment, FunctionComponent, HostComponent, HostPortal, HostRoot, HostText} from "./ReactWorkTags";

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
 * 提交调和产生的 effects, 这里的 effects 是调和产生的 flags, 注意 effect 可以同时是多个
 */
function commitReconciliationEffects(finishedWork: Fiber) {
    const flags = finishedWork.flags;

    // 新增插入
    if (flags & Placement) {
        commitPlacement(finishedWork);
        finishedWork.flags &= ~Placement;
    }
}

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
        case HostText: {
            const parentFiber = getHostParentFiber(finishedWork)!;
            if (parentFiber !== null) {
                const parentElement: Element = parentFiber.stateNode.containerInfo;
                parentElement.appendChild(finishedWork.stateNode);
            }
            break;
        }
        case HostComponent: {
            const parentFiber = getHostParentFiber(finishedWork)!;
            if (parentFiber.tag === HostRoot) {
                const parent: Element = parentFiber.stateNode.containerInfo;
                parent.appendChild(finishedWork.stateNode);
            } else {
                const parent: Element = parentFiber.stateNode;
                parent.appendChild( finishedWork.stateNode);
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

/**
 * 查找最近的原生 DOM 节点 fiber
 * @param fiber
 */
function getHostParentFiber(fiber: Fiber) {
    let parent = fiber.return;
    while (parent !== null) {
        if (isHostParent(parent)) {
            return parent;
        }
        parent = parent.return;
    }
}

function isHostParent(fiber: Fiber): boolean {
    return (
        fiber.tag === HostComponent ||
        fiber.tag === HostRoot ||
        fiber.tag === HostPortal
    );
}

