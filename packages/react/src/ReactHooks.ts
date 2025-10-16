import { ReactSharedInternals } from "./ReactSharedInternals";
import type { Dispatcher } from "react-reconciler";

type Dispatch<A> = (action: A) => void;

type BaseStateAction<S> = ((state: S) => S) | S;

function resolveDispatcher(): Dispatcher {
    const dispatcher = ReactSharedInternals.H;
    if (dispatcher === null) {
        throw new Error(
            'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
            ' one of the following reasons:\n' +
            '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
            '2. You might be breaking the Rules of Hooks\n' +
            '3. You might have more than one copy of React in the same app\n' +
            'See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.',
        );
    }

    return dispatcher;
}

function useReducer<S, I, A>(
    reducer: ((state: S, action: A) => S) | null,
    initialArg: I,
    init?: (initialState: I) => S,
): [S, Dispatch<A>] {
    const dispatcher = resolveDispatcher();
    return dispatcher.useReducer(reducer, initialArg, init);
}

function useState<S>(initialState: (() => S) | S): [S, Dispatch<BaseStateAction<S>>] {
    const init: S = typeof initialState === "function" ? (initialState as any)() : initialState;
    return useReducer(null, init);
}

export {
    useReducer,
    useState
};
