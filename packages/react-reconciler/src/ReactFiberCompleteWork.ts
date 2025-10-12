import type { Fiber } from "./ReactInternalTypes";
import { ClassComponent, Fragment, FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";

export function completeWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
    switch (workInProgress.tag) {
        case ClassComponent:
        case FunctionComponent:
        case Fragment:
        case HostRoot: {
            return null;
        }
        case HostComponent: {
            // 更新阶段
            if (current !== null && workInProgress.stateNode !== null) {
                const type = workInProgress.type;
                updateHostComponent(current, workInProgress, type, workInProgress.pendingProps);
            } else {
                // 挂载阶段
                const instance = document.createElement(workInProgress.type) as Element;
                finalizeInitialChildren(instance, null, workInProgress.pendingProps);
                appendAllChildren(instance, workInProgress);
                workInProgress.stateNode = instance;
            }

            return null;
        }
        case HostText: {
            workInProgress.stateNode = document.createTextNode(workInProgress.pendingProps);
            return null;
        }
    }

    throw new Error(
        `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
        'React. Please file an issue.',
    );
}

function updateHostComponent(current: Fiber | null, workInProgress: Fiber, _type: string, newProps: any) {
    if (current?.memoizedProps === newProps) {
        return;
    }

    finalizeInitialChildren(workInProgress.stateNode, current?.memoizedProps, newProps);
}

/**
 * 将所有 props 添加到 element DOM 中
 */
function finalizeInitialChildren(element: Element, oldProps: any, newProps: any) {
    for (const oldKey in oldProps) {
        const propValue = oldProps[oldKey];
        if (oldKey === "children") {
            if (typeof propValue === "string" || typeof propValue === "number") {
                element.textContent = "";
            }
        } else if (oldKey === "style") {
            (element as HTMLElement).style.cssText = "";
        } else {
            if (oldKey === "onClick") {
                element.removeEventListener("click", propValue);
            } else {
                (element as any)[oldKey] = null;
            }
        }
    }

    for (const propKey in newProps) {
        const propValue = newProps[propKey];
        if (propKey === "children") {
            if (typeof propValue === "string" || typeof propValue === "number") {
                element.textContent = propValue + "";
            }
        } else if (propKey === "style") {
            if (typeof propValue === "object" && propValue !== null) {
                for (const styleKey in propValue) {
                    ((element as HTMLElement).style as any)[styleKey] = propValue[styleKey];
                }
            }
        }  else {
            if (propKey === "onClick") {
                element.addEventListener("click", propValue);
            } else {
                (element as any)[propKey] = newProps[propKey];
            }
        }
    }
}

/**
 * 将所有 workInProgress 层级的所有 DOM 插入到 parent 中
 */
function appendAllChildren(parent: Element, workInProgress: Fiber) {
    let node = workInProgress.child;
    // debugger;
    while (node !== null) {
        // node 是一个 DOM 元素
        if (node.tag === HostComponent || node.tag === HostText) {
            parent.appendChild(node.stateNode);
        } else if (node.child !== null) {
            // 当节点不是一个
            // 这种情况发生在 Fragment 之类的情况，当前 Fiber 并没有直接的 DOM 元素，需要往里层查找 DOM 元素
            // 因为底部往上遍历，所以这里的操作是安全的
            node = node.child;
            continue;
        }

        // 下面判断条件中的退出条件
        if (node === workInProgress) {
            return;
        }

        // 第一个条件中插入了节点之后，如果没有相邻的其他节点
        while (node.sibling === null) {
            // node.return === null 到了顶层
            if (node.return === null || node.return === workInProgress) {
                return;
            }
            node = node.return;
        }

        // 处理相邻节点
        node = node.sibling;
    }
}
