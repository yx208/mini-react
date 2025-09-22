import { getCurrentTime } from "shared/utils";
import { NormalPriority, scheduleCallback } from "scheduler";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { commitMutationEffects } from "./ReactFiberCommitWork";

type ExecutionContext = number;

const NoContext = 0b000;
// const BatchedContext = 0b001;
const RenderContext = 0b010;
const CommitContext = 0b100;

// 描述我们在 React 执行栈中的位置
let executionContext: ExecutionContext = NoContext;
// 当前正在工作的 Fiber
let workInProgress: Fiber | null = null;
// 当前正在工作的 FiberRoot
let workInProgressRoot: FiberRoot | null = null;

/**
 * scheduleUpdateOnFiber 函数在 React 中被多次调用
 * 它是告知 React 进行渲染的途径。该函数当组件状态改变（setState、useState）或 props 变化时被调用
 */
export function scheduleUpdateOnFiber(root: FiberRoot, fiber: Fiber) {
    // 将 root 标记为已更新
    // 这个过程，会将 updateLane 添加到 root 的属性中：pendingLanes，它指的是挂起的 root's work
    // scheduleUpdateOnFiber();

    workInProgress = fiber;
    workInProgressRoot = root;

    // 源码中在此之前会有一判断，用于判断的更新类型。此处默认为正常更新，跳过前面步骤，走到下面函数
    ensureRootIsScheduled(root, getCurrentTime());

    // 必定不会触发的代码
    if (workInProgressRoot !== window as unknown as any) {
        console.log(root);
    }
}

/**
 * 通过 scheduleMicrotask 安排一个微任务，这意味着 React 将在 main.tsx 文件执行完成后开始渲染组件
 */
function ensureRootIsScheduled(root: FiberRoot, _currentTime: number) {
    // 当调用栈为空时，JavaScript 事件循环将处理任务队列，并最终调用在此处安排的回调
    scheduleMicrotask(() => {
        scheduleTaskForRootDuringMicrotask(root);
    });
}

function scheduleMicrotask(fn: () => void) {
    const isSupportedMicrotask = true;
    if (isSupportedMicrotask) {
        queueMicrotask(fn);
    } else {
        // fallback
    }
}

function scheduleTaskForRootDuringMicrotask(root: FiberRoot) {
    scheduleCallback(
        NormalPriority,
        performConcurrentWorkOnRoot.bind(null, root),
    );
}

/**
 * 并发渲染起来，调度器在合适时候调用
 */
function performConcurrentWorkOnRoot(root: FiberRoot) {
    // 1 render stage 构建 fiber 树
    renderRootSync(root);

    // current.alternate 就是解析完毕的最新 Fiber 树
    root.finishedWork = root.current.alternate;

    // 2 commit stage V-DOM 更新到 DOM
    commitRoot(root);
}

/**
 * 构建 fiber 树
 */
function renderRootSync(root: FiberRoot) {
    const prevExecutionContext = executionContext;
    executionContext |= RenderContext;

    // 初始化 WIP 树，设置相关全局变量
    prepareFreshStack(root);
    // 遍历构建 Fiber 树
    workLoopSync();

    executionContext = prevExecutionContext;
    // 将此设置为 null 以指示没有正在进行的渲染
    workInProgressRoot = null;
}

function commitRoot(root: FiberRoot) {
    const prevExecutionContext = executionContext;
    executionContext |= CommitContext;

    commitMutationEffects(root, root.finishedWork!);

    executionContext = prevExecutionContext;
    // 将此设置为 null 以指示没有正在进行的渲染
    workInProgressRoot = null;
}

/**
 * 负责清除和重置之前渲染或工作过程中附加的任何信息
 * 原理查看 README
 */
function prepareFreshStack(root: FiberRoot) {
    root.finishedWork = null;

    workInProgressRoot = root;
    // 根据 current Fiber 给当前 Root 创建 workInProgress Fiber
    // 也就是创建当前要更新的 fiber，因为现在的 current 是旧的状态
    const rootWorkInProgress = createWorkInProgress(root.current, null);
    // 设置当前要工作的 Fiber 树
    workInProgress = rootWorkInProgress;

    return rootWorkInProgress;
}

function workLoopSync() {
    // 同步，所以执行工作时不检查是否需要让出控制权
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress);
    }
}

/**
 * 执行某个 work（工作单元）
 * 1. beginWork
 * 2. completeWork
 */
function performUnitOfWork(unitOfWork: Fiber) {
    const current = unitOfWork.alternate;

    // beginWork 不断返回子 Fiber
    const next = beginWork(current, unitOfWork);
    // 协调完之后，把 pending 更新为 memoized
    unitOfWork.memoizedProps = unitOfWork.pendingProps;

    // 达到树底部
    if (next === null) {
        // 当深度达到最底层，调用 completeUnitOfWork 完成该节点的工作
        completeUnitOfWork(unitOfWork);
    } else {
        workInProgress = next;
    }

    // finished
}

/**
 * 在 performUnitOfWork 中调用这个函数的时候已经到达树的左侧最底部
 * 1. 先完成节点的工作
 * 2. 而后判断是否有相邻节点
 */
function completeUnitOfWork(unitOfWork: Fiber) {
    let completedWork = unitOfWork;

    do {
        const current = completedWork.alternate;
        const returnFiber = completedWork.return;

        const next = completeWork(current, completedWork);
        if (next !== null) {
            workInProgress = next;
            return;
        }

        const siblingFiber = completedWork.sibling;
        if (siblingFiber !== null) {
            workInProgress = siblingFiber;
            return;
        }

        // 否则，返回到父级
        completedWork = returnFiber as Fiber;
        // 更新我们正在处理的下一件事，以防万一
        workInProgress = completedWork;
    } while (completedWork !== null);
}

