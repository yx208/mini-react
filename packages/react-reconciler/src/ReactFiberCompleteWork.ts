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
            // 这种情况发生在 Fragment 之类的情况，当前 Fiber 并没有直接的 DOM 元素，需要往里层查找 DOM 元素
            // 因为底部往上遍历，所以这里的操作是安全的
            node = node.child;
            continue;
        }

        if (node === workInProgress) {
            return;
        }

        // const fragment = (
        //     <div className="wrapper">
        //          <>
        //              <>
        //                  <div>A</div>
        //                  <div>B</div>
        //              </>
        //              <div>C</div>
        //              <>D</>
        //          </>
        //     </div>
        //  );
        // 在上面的 B 节点就会走到这里，先回到 B 的父 Fragment 然后继续父元素的相邻节点
        // 因为上面使用 "node = node.child" 往下遍历到底层
        while (node.sibling === null) {
            if (node.return === null || node.return === workInProgress) {
                return;
            }
            node = node.return;
        }

        node = node.sibling;
    }
}
