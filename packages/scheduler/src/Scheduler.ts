import { getCurrentTime } from "shared/utils";
import { SchedulerMinHeap } from "./SchedulerMinHeap";

type TaskCallback = (isCallbackTimeout: boolean) => TaskCallback | null | undefined | void;

enum PriorityLevel {
    NoPriority,
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority,
    IdlePriority,
}

enum PriorityTimeout {
    IMMEDIATE_PRIORITY_TIMEOUT = -1,

    // Eventually times out
    USER_BLOCKING_PRIORITY_TIMEOUT = 250,
    NORMAL_PRIORITY_TIMEOUT = 5000,
    LOW_PRIORITY_TIMEOUT = 10000,

    // Max 31 bit integer. The max integer size in V8 for 32-bit systems.
    // Math.pow(2, 30) - 1
    // 0b111111111111111111111111111111
    // var maxSigned31BitInt = 1073741823;
    //
    // Never times out
    IDLE_PRIORITY_TIMEOUT = 1073741823,
}

export type Task = {
    id: number;
    callback: TaskCallback | null;
    priorityLevel: PriorityLevel;
    startTime: number;
    expirationTime: number;
    sortIndex: number;
}

const taskQueue = new SchedulerMinHeap<Task>();

let taskIdCounter = 1;
let currentTask: Task | null = null;
let currentPriorityLevel: PriorityLevel = PriorityLevel.NoPriority;

// 切片开始的时间
let startTime = -1;

// 切片时间段
const frameInterval = 5;

// 主线程是否在调度
let isHostCallbackScheduled = false;

// 消息循环在运行否
let isMessageLoopRunning = false;

// 是否有 work 在执行
let isPerformingWork = false;

function cancelCallback(task: Task) {
    task.callback = null;
}

/**
 * 控制权是否交还给主线程
 */
function shouldYieldToHost() {
    return getCurrentTime() >= frameInterval;
}

/**
 * @param initialTime
 * @returns - true: 任务没有执行完, false: 任务执行完毕
 */
function workLoop(initialTime: number) {
    const currentTime = initialTime;
    currentTask = taskQueue.peek();

    while (currentTask !== null) {
        // 任务没过期，但需要让出执行权
        if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
            break;
        }

        const callback = currentTask.callback;
        // 可能会取消
        if (typeof callback === "function") {
            currentTask.callback = null;
            currentPriorityLevel = currentTask.priorityLevel;

            // 用户回调是否超时
            //
            // 通过 `currentTask.expirationTime > currentTime && shouldYieldToHost()` 能走到这，其结果有以下
            // 1. currentTask.expirationTime > currentTime = false; 任务已过期，需要强制执行
            // 2. currentTask.expirationTime > currentTime = true; 任务没过期
            //    且 shouldYieldToHost() = true; 还有执行时间
            const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
            // 任务未执行完成会返回个回调
            const continuationCallback = callback(didUserCallbackTimeout);
            if (typeof continuationCallback === "function") {
                currentTask.callback = continuationCallback;
                return true;
            } else {
                if (currentTask === taskQueue.peek()) {
                    taskQueue.pop();
                }
            }
        } else {
            taskQueue.pop();
        }

        currentTask = taskQueue.peek();
    }

    // 经过 while 之后还有任务?
    return currentTask !== null;
}

function scheduleCallback(priorityLevel: PriorityLevel, callback: TaskCallback) {
    const startTime = getCurrentTime();

    let timeout: number;
    switch (priorityLevel) {
    case PriorityLevel.ImmediatePriority:
        timeout = PriorityTimeout.IMMEDIATE_PRIORITY_TIMEOUT;
        break;
    case PriorityLevel.UserBlockingPriority:
        timeout = PriorityTimeout.USER_BLOCKING_PRIORITY_TIMEOUT;
        break;
    case PriorityLevel.LowPriority:
        timeout = PriorityTimeout.LOW_PRIORITY_TIMEOUT;
        break;
    case PriorityLevel.IdlePriority:
        timeout = PriorityTimeout.IDLE_PRIORITY_TIMEOUT;
        break;
    default:
        timeout = PriorityTimeout.NORMAL_PRIORITY_TIMEOUT;
        break;
    }

    const expirationTime = startTime + timeout;
    const task: Task = {
        id: taskIdCounter++,
        callback,
        priorityLevel,
        startTime,
        expirationTime,
        sortIndex: expirationTime,
    };
    taskQueue.push(task);

    if (!isHostCallbackScheduled && !isPerformingWork) {
        isHostCallbackScheduled = true;
        requestHostCallback();
    }

    return task;
}

/**
 * 在浏览器空闲时间安排和执行任务
 */
function requestHostCallback() {
    if (!isMessageLoopRunning) {
        isMessageLoopRunning = true;
        schedulePerformWorkUntilDeadline();
    }
}

// 通过 MessageChannel 创建宏任务
const channel = new global.MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

function schedulePerformWorkUntilDeadline() {
    port.postMessage(null);
}

// 处理 Channel 宏任务触发
function performWorkUntilDeadline() {
    const currentTime = getCurrentTime();
    startTime = currentTime;

    let hasMoreWork = true;
    try {
        hasMoreWork = flushWork(currentTime);
    } finally {
        if (hasMoreWork) {
            schedulePerformWorkUntilDeadline();
        } else {
            isMessageLoopRunning = false;
        }
    }
}

function flushWork(initialTime: number) {
    isHostCallbackScheduled = false;
    isPerformingWork = true;

    const previousPriorityLevel = currentPriorityLevel;
    try {
        return workLoop(initialTime);
    } finally {
        currentTask = null;
        isPerformingWork = false;
        currentPriorityLevel = previousPriorityLevel;
    }
}

export {
    cancelCallback,
    scheduleCallback,
    startTime,
    PriorityLevel,
}

