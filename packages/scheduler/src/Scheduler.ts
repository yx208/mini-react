import { getCurrentTime } from "shared/utils";
import { SchedulerMinHeap } from "./SchedulerMinHeap";
import {
    type PriorityLevel,
    IdlePriority,
    ImmediatePriority,
    LowPriority,
    NoPriority,
    NormalPriority,
    UserBlockingPriority
} from "./SchedulerPriorities";

type TaskCallback = (isCallbackTimeout: boolean) => TaskCallback | null | undefined | void;

const IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
const USER_BLOCKING_PRIORITY_TIMEOUT = 250;
const NORMAL_PRIORITY_TIMEOUT = 5000;
const LOW_PRIORITY_TIMEOUT = 10000;
// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
// var maxSigned31BitInt = 1073741823;
//
// Never times out
const IDLE_PRIORITY_TIMEOUT = 1073741823;

export type Task = {
    id: number;
    callback: TaskCallback | null;
    priorityLevel: PriorityLevel;
    startTime: number;
    expirationTime: number;
    sortIndex: number;
}

// 立即执行的任务
const taskQueue = new SchedulerMinHeap<Task>();
// 延迟执行的任务
const timerQueue = new SchedulerMinHeap<Task>();

// const scheduleStats = {};

// 增长的任务 id
let taskIdCounter = 1;
// 延时任务定时器 ID
let taskTimeoutID: number = -1;
// 当前正在执行的任务
let currentTask: Task | null = null;
let currentPriorityLevel: PriorityLevel = NoPriority;

// 切片开始的时间
let startTime = -1;

// 切片时间段
const frameInterval = 5;

// 主线程是否在调度普通任务
let isHostCallbackScheduled = false;
// 主线程是否有其他延时任务在执行了
let isHostTimeoutScheduled = false;

// 消息循环在运行否
let isMessageLoopRunning = false;

// 是否有 work 在执行
let isPerformingWork = false;

function cancelCallback(task: Task) {
    task.callback = null;
}

function cancelHostTimeout() {
    clearTimeout(taskTimeoutID);
    taskTimeoutID = -1;
}

/**
 * 控制权是否交还给主线程
 */
function shouldYieldToHost() {
    const timeElapsed = getCurrentTime() - startTime;
    return timeElapsed >= frameInterval;
}

/**
 * @param initialTime
 * @returns - true: 任务没有执行完, false: 任务执行完毕
 */
function workLoop(initialTime: number) {
    let currentTime = initialTime;

    // 检查是否有延时任务需要插入队列
    advanceTimers(currentTime);

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

            // 执行完任务回调，更新当前时间
            currentTime = getCurrentTime();

            if (typeof continuationCallback === "function") {
                currentTask.callback = continuationCallback;
            } else {
                if (currentTask === taskQueue.peek()) {
                    taskQueue.pop();
                }
            }

            // 检查是否有延时任务需要插入队列
            advanceTimers(currentTime);
        } else {
            taskQueue.pop();
        }

        currentTask = taskQueue.peek();
    }

    if (currentTask !== null) {
        return true;
    } else {
        // 线程空闲，检查其他优先级任务
        const firstTimer = timerQueue.peek();
        if (firstTimer !== null) {
            requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
        }
        return false;
    }
}

function scheduleCallback(
    priorityLevel: PriorityLevel,
    callback: TaskCallback,
    options?: { delay: number }
) {
    const currentTime = getCurrentTime();
    let startTime: number;

    if (typeof options === "object" && options !== null) {
        if (typeof options.delay === "number" && options.delay > 0) {
            startTime = currentTime + options.delay;
        } else {
            startTime = currentTime;
        }
    } else {
        startTime = currentTime;
    }

    let timeout: number;
    switch (priorityLevel) {
        case ImmediatePriority:
            timeout = IMMEDIATE_PRIORITY_TIMEOUT;
            break;
        case UserBlockingPriority:
            timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
            break;
        case LowPriority:
            timeout = LOW_PRIORITY_TIMEOUT;
            break;
        case IdlePriority:
            timeout = IDLE_PRIORITY_TIMEOUT;
            break;
        case NormalPriority:
        default:
            timeout = NORMAL_PRIORITY_TIMEOUT;
            break;
    }

    const expirationTime = startTime + timeout;
    const newTask: Task = {
        id: taskIdCounter++,
        callback,
        priorityLevel,
        startTime,
        expirationTime,
        sortIndex: -1,
    };

    if (startTime > currentTime) {
        // 延时任务在到达开始时间之后，添加到普通任务队列执行
        // 所以延时任务的的排序应以开始时间为基准
        newTask.sortIndex = startTime;
        timerQueue.push(newTask);

        // 高优先级的立即执行任务能够得到优先处理，并且有没有其他定时任务在执行
        // 当 timerQueue.push 之后会进行优先级排序，单线程任务调度只需要调度最优先要得到处理的任务即可
        // 当添加的任务是最高优先级的延时任务，则进行调度
        if (taskQueue.peek() === null && newTask === timerQueue.peek()) {
            // 如果当前任务是最高优先级，但有其他任务在进行调度，则取消之前的
            if (isHostTimeoutScheduled) {
                cancelHostTimeout();
            } else {
                isHostTimeoutScheduled = true;
            }
            requestHostTimeout(handleTimeout, startTime - currentTime);
        }
    } else {
        newTask.sortIndex = expirationTime;
        taskQueue.push(newTask);

        if (!isHostCallbackScheduled && !isPerformingWork) {
            isHostCallbackScheduled = true;
            requestHostCallback();
        }
    }


    return newTask;
}

function requestHostTimeout(callback: (time: number) => void, ms: number) {
    taskTimeoutID = setTimeout(() => {
        callback(getCurrentTime());
    }, ms) as unknown as number;
}

/**
 * 延时任务到期回调
 */
function handleTimeout(currentTime: number) {
    isHostTimeoutScheduled = false;
    advanceTimers(currentTime);

    // 延时队列推送立即执行队列完了之后，如果主线程有空闲则立即执行
    if (!isHostCallbackScheduled) {
        // 有可执行任务
        if (taskQueue.peek() !== null) {
            isHostCallbackScheduled = true;
            requestHostCallback();
        } else {
            // 其他优先级批次的任务
            const firstTimer = timerQueue.peek();
            if (firstTimer !== null) {
                requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
            }
        }
    }
}

/**
 * 把当前优先级批次的任务，从延时队列添加到立即执行队列
 */
function advanceTimers(currentTime: number) {
    let timer = timerQueue.peek();
    while (timer !== null) {
        if (timer.callback === null) {
            timerQueue.pop();
        } else if (timer.startTime <= currentTime) {
            // 任务时间就绪，可以执行
            timerQueue.pop();
            timer.sortIndex = timer.expirationTime;
            taskQueue.push(timer);
        } else {
            return;
        }

        // 查看下一个是否还可以执行，即有一批任务是相同优先级的延时任务
        timer = timerQueue.peek();
    }
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
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

function schedulePerformWorkUntilDeadline() {
    port.postMessage(null);
}

// 处理 Channel 宏任务触发
function performWorkUntilDeadline() {
    if (isMessageLoopRunning) {
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
    cancelHostTimeout,
    scheduleCallback,
};

