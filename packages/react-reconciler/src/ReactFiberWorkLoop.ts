import { getCurrentTime } from "shared/utils";
import { PriorityLevel, scheduleCallback } from "scheduler";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";

export const enum ExecutionContext {
    NoContext = 0b000,
    BatchedContext = 0b001,
    RenderContext = 0b010,
    CommitContext = 0b100,
}

// 描述我们在 React 执行栈中的位置
let executionContext: ExecutionContext = ExecutionContext.NoContext;
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
        PriorityLevel.NormalPriority,
        performConcurrentWorkOnRoot.bind(null, root),
    );
}

/**
 * 在 root 上执行并发工作
 * 这是每个并发任务的入口点，即通过 Scheduler 的任何任务。
 */
function performConcurrentWorkOnRoot(root: FiberRoot) {
    // 1 render stage 构建 fiber 树
    // 1.1 beginWork
    // 1.2 completeWork
    renderRootSync(root);

    console.log(root);

    // 2 commit stage V-DOM 更新到 DOM
    // commitRoot()
}

function renderRootSync(root: FiberRoot) {
    const prevExecutionContext = executionContext;
    executionContext |= ExecutionContext.RenderContext;

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
 * @param unitOfWork - 正在调度的 Fiber
 */
function performUnitOfWork(unitOfWork: Fiber) {
    // 当前，该 fiber 处于刷新状态，这是交替状态
    // 理想情况下，不应该有任何东西依赖于它，但在这里依赖它意味着我们不需要在进行中的工作上添加额外的字段
    const current = unitOfWork.alternate;

    // beginWork
    const next = beginWork(current, unitOfWork);
    if (next === null) {
        // 如果这没有生成新 work，则完成当前 work
        completeUnitOfWork(unitOfWork);
    } else {
        workInProgress = next;
    }

    // finished
}

/**
 * 从下到上遍历（深度优先遍历），完成节点工作并构建 effectList，构建的 effectList 将在 commit 阶段被使用
 *
 * 核心
 * 1. 执行时机：当 beginWork 返回 null（表示没有子节点需要处理）时被调用
 * 2. 主要职责：完成当前 Fiber 节点的收尾工作、构建 effectList（副作用链表）、决定下一个要处理的工作单元、处理错误边界
 * 3. 遍历策略：采用后序遍历，从叶子节点开始向上回溯，处理兄弟节点和父节点
 * 4. 性能优化：通过构建 effectList，避免在 commit 阶段遍历整个 Fiber 树，实现了空间换时间的优化
 * 5. 可中断性: 在 Concurrent Mode 下支持中断和恢复，实现时间切片
 */
function completeUnitOfWork(unitOfWork: Fiber) {
    let completedWork = unitOfWork;

    do {
        const current = unitOfWork.alternate;
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
        completedWork = returnFiber;
        // 更新我们正在处理的下一件事，以防万一
        workInProgress = completedWork;
    } while (completedWork !== null);
}

function completeWork(current: Fiber | null, workInProgress: Fiber): Fiber | null {
    return null;
}
