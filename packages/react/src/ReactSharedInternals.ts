import type { Dispatcher } from "react-reconciler";

type SharedStateClient = {
    H: Dispatcher | null;
}

const ReactSharedInternals: SharedStateClient = {
    H: null,
};

export {
    ReactSharedInternals
};
