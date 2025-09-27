import type { Fiber } from "./ReactInternalTypes";
import { Fragment, HostComponent, HostRoot, HostText } from "./ReactWorkTags";

export function completeWork(_current: Fiber | null, workInProgress: Fiber): Fiber | null {
    switch (workInProgress.tag) {
        case Fragment:
        case HostRoot: {
            // 这两个类型并没有具体的 DOM 元素
            return null;
        }
        case HostComponent: {
            const instance = document.createElement(workInProgress.type) as Element;
            finalizeInitialChildren(instance, workInProgress.pendingProps);
            appendAllChildren(instance, workInProgress);
            workInProgress.stateNode = instance;
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

/**
 * 将所有 props 添加到 element DOM 中
 */
function finalizeInitialChildren(element: Element, props: any) {
    for (const propsKey in props) {
        const propValue = props[propsKey];
        if (propsKey === "children") {
            if (typeof propValue === "string" || typeof propValue === "number") {
                element.textContent = propValue + "";
            }
        } else {
            (element as any)[propsKey] = props[propsKey];
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
