import type { Fiber } from "./ReactInternalTypes";
import { HostComponent, HostRoot } from "./ReactWorkTags";

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
            element.setAttribute(propsKey, props[propsKey]);
        }
    }
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
    const child = workInProgress.child;
    if (child) {
        parent.appendChild(child.stateNode);
    }
}
