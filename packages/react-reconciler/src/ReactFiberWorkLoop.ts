import { getCurrentTime } from "shared/utils";
import { NormalPriority, scheduleCallback } from "scheduler";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";

type ExecutionContext = number;

const NoContext = 0b000;
// const BatchedContext = 0b001;
const RenderContext = 0b010;
// const CommitContext = 0b100;

// 描述我们在 React 执行栈中的位置
let executionContext: ExecutionContext = NoContext;
// 当前正在工作的 Fiber
let workInProgress: Fiber | null = null;
// 当前正在工作的 FiberRoot
let workInProgressRoot: FiberRoot | null = null;

/**
 * 先实现初次渲染
 */
export function scheduleUpdateOnFiber(root: FiberRoot, fiber: Fiber) {
    workInProgress = fiber;
    workInProgressRoot = root;
    ensureRootIsScheduled(root, getCurrentTime());

    if (fiber === window as unknown as any) {
        console.log(workInProgressRoot);
    }
}

/**
 * 参见 README
 */
function ensureRootIsScheduled(root: FiberRoot, _currentTime: number) {
    // 在微任务期间为 root 安排任务
    queueMicrotask(() => {
        scheduleTaskForRootDuringMicrotask(root);
    });
}

/**
 * 在微任务期间为 root 安排任务
 */
function scheduleTaskForRootDuringMicrotask(root: FiberRoot) {
    scheduleCallback(
        NormalPriority,
        performConcurrentWorkOnRoot.bind(null, root),
    );
}

/**
 * 在 root 上执行并发工作
 * 这是每个并发任务的入口点，即通过 Scheduler 的任何任务。
 */
function performConcurrentWorkOnRoot(root: FiberRoot) {
    // 1 render stage 构建 fiber 树
    renderRootSync(root);

    console.log(root);

    // 2 commit stage V-DOM 更新到 DOM
    // commitRoot()
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

/**
 * 负责清除和重置之前渲染或工作过程中附加的任何信息
 * 原理查看 README
 */
function prepareFreshStack(root: FiberRoot) {
    root.finishedWork = null;

    workInProgressRoot = root;
    // 根据 current Fiber 给当前 Root 创建 workInProgress Fiber
    // 也就是创建当前要更新的 fiber，因为现在的 current 是旧的状态
    const rootWorkInProgress = createWorkInProgress(root.current!, null);
    // 设置当前要工作的 Fiber 树
    if (workInProgress === null) {
        workInProgress = rootWorkInProgress;
    }

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

    // beginWork 不断返回子节点；即深度优先
    const next = beginWork(current, unitOfWork);
    unitOfWork.memoizedProps = unitOfWork.pendingProps;

    if (next === null) {
        // 当深度达到最底层，调用 completeUnitOfWork 完成该节点的工作
        completeUnitOfWork(unitOfWork);
    } else {
        workInProgress = next;
    }

    // finished
}

/**
 * 函数负责在 Fiber 树的遍历过程中完成当前工作单元的处理，并决定下一个要处理的 Fiber 节点
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

