import type { ReactNodeList } from "shared/ReactTypes";
import { createFiberRoot, type FiberRoot, updateContainer } from "react-reconciler";

export function createRoot(container: Element | Document | DocumentFragment) {
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
