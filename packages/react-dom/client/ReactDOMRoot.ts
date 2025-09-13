import type { ReactNodeList } from "shared/ReactTypes";
import { createFiberRoot, type FiberRoot, updateContainer } from "react-reconciler";
import { DOCUMENT_FRAGMENT_NODE, DOCUMENT_NODE, ELEMENT_NODE } from "./HTMLNodeType";

export function createRoot(container: Element | Document | DocumentFragment) {
    if (!isValidContainer(container)) {
        throw new Error('createRoot(...): Target container is not a DOM element.');
    }

    const root = createFiberRoot(container);

    return new ReactDOMRoot(root);
}

class ReactDOMRoot {
    _internalRoot: FiberRoot;

    constructor(internalRoot: FiberRoot) {
        this._internalRoot = internalRoot;
    }

    render(children: ReactNodeList) {
        const root = this._internalRoot;
        if (root === null) {
            throw new Error('Cannot update an unmounted root.');
        }

        updateContainer(children, root);
    }

    unmount() {

    }
}

function isValidContainer(node: any) {
    return !!(
        node && (
            node.nodeType === ELEMENT_NODE ||
            node.nodeType === DOCUMENT_NODE ||
            node.nodeType === DOCUMENT_FRAGMENT_NODE
        )
    );
}
