import type { Fiber } from "./ReactInternalTypes";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";

export function completeWork(_current: Fiber | null, workInProgress: Fiber): Fiber | null {
    switch (workInProgress.tag) {
        case HostRoot: {
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

function appendAllChildren(parent: Element, workInProgress: Fiber) {
    let node = workInProgress.child;
    while (node !== null) {
        parent.appendChild(node.stateNode);
        node = node.sibling;
    }
}
