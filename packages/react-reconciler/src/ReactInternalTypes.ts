import { type Flags, NoFlags } from "./ReactFiberFlags";
import type { WorkTag } from "./ReactWorkTags";

export class Fiber {
    // Fiber 标记
    tag: WorkTag;

    // 唯一标识（同一层级唯一即可）
    key: string | null;

    // 组件类型
    elementType: any;

    // 组件类型
    // 原生组件值为字符串；函数组件值为函数；类组件值为类
    type: any;

    // 原生标签：DOM 值，类组件：实例，函数组件：null，根节点：FiberRoot
    stateNode: any;

    // 父 Fiber
    return: Fiber | null;

    // 第一个子节点 Fiber
    child: Fiber | null;

    // 下一个兄弟节点 Fiber
    sibling: Fiber | null;

    // 记录节点在当前层级的位置，在 diff 的时候判断是否发生移动
    index: number;

    // 要更新的 props
    pendingProps: any;

    // 当前使用的 props
    memoizedProps: any;

    // 组件相关状态存储
    memoizedState: any;

    // mode: TypeOfMode;

    // 组件副作用行为：更新？插入？新增？删除？
    flags: Flags;
    deletions: Array<Fiber> | null;

    // 缓存 Fiber，在 Diff 的时候对比新老 VDOM
    alternate: Fiber | null;

    constructor(tag: WorkTag, pendingProps: any, key: string | null) {
        // Instance
        this.tag = tag;
        this.key = key;
        this.elementType = null;
        this.type = null;
        this.stateNode = null;

        // fiber
        this.index = 0;
        this.return = null;
        this.child = null;
        this.sibling = null;

        this.pendingProps = pendingProps;
        this.memoizedProps = null;
        this.memoizedState = null;

        // Effects
        this.flags = NoFlags;
        this.deletions = null;

        this.alternate = null;
    }
}

export type Container = Element | Document | DocumentFragment;

export type FiberRoot = {
    containerInfo: Container;
    current: Fiber;
    finishedWork: Fiber | null;
}

type Dispatch<A> = (action: A) => void;

type BaseStateAction<S> = (() => S) | S;

export type Dispatcher = {
    useReducer<S, I, A>(
        reducer: ((state: S, action: A) => S) | null,
        initialArg: I,
        init?: (initState: I) => S
    ): [S, Dispatch<A>];
    useState<S>(initialState: (() => S) | S): [S, Dispatch<BaseStateAction<S>>]
}
