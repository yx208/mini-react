import { getCurrentTime } from "shared/utils";
import { PriorityLevel, scheduleCallback } from "scheduler";
import type { Fiber, FiberRoot } from "./ReactInternalTypes";
import { createWorkInProgress } from "./ReactFiber";

export enum ExecutionContext {
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
 * 确保 React 的根节点（Root）有一个调度任务在执行或等待执行
 *
 * 如果某个任务已被安排，我们将检查现有任务的优先级，以确保其优先级与根节点正在处理的下一级任务的优先级相同
 * 每次更新时以及退出任务之前都会调用此函数
 *
 * 核心功能：
 * 1 React 18 引入了并发特性，不同更新有不同优先级（如用户输入优先级高于数据获取），ensureRootIsScheduled 确保高优先级任务能够打断低优先级任务
 * 2 通过检查现有的调度任务和优先级，避免为相同优先级的更新创建多个调度任务，提高性能
 * 3 多个更新可能在短时间内触发，这个函数会将它们合并到一个调度任务中，实现自动批处理
 * 4 对于并发任务，通过 Scheduler 调度，支持时间切片（Time Slicing），让浏览器有机会处理用户输入和其他高优先级任务
 * 5 无论是 setState、forceUpdate 还是其他触发更新的方式，最终都会调用这个函数，提供了一个统一的调度管理点
 */
function ensureRootIsScheduled(root: FiberRoot, currentTime: number) {
    console.log("ensureRootIsScheduled", currentTime);

    queueMicrotask(() => {
        scheduleTaskForRootDuringMicrotask(root);
    });
}

function scheduleTaskForRootDuringMicrotask(root: FiberRoot) {
    scheduleCallback(
        PriorityLevel.NormalPriority,
        performConcurrentWorkOnRoot.bind(null, root),
    );
}

/**
 * 这是每个并发任务的入口点，即通过 Scheduler 的任何任务。
 */
function performConcurrentWorkOnRoot(root: FiberRoot) {
    // 1 render stage 构建 fiber 树
    renderRootSync(root);
    // 2 commit stage V-DOM 更新到 DOM
}

function renderRootSync(root: FiberRoot) {
    const prevExecutionContext = executionContext;
    executionContext |= ExecutionContext.RenderContext;

    // 初始化
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
    const rootWorkInProgress = createWorkInProgress(root.current, null);
    // 设置当前要工作的 Fiber 树
    workInProgress = rootWorkInProgress;

    return rootWorkInProgress;
}

function workLoopSync() {
    while (workInProgress !== null) {
        performUnitOfWork(workInProgress);
    }
}

function performUnitOfWork(fiber: Fiber) {

}
