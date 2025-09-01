import { getCurrentTime } from "shared/utils";

// type PriorityLevel = 0 | 1 | 2 | 3 | 4 | 5;
import {SchedulerMinHeap} from "./SchedulerMinHeap";

type TaskCallback = (arg: boolean) => TaskCallback | null | undefined;

enum PriorityLevel {
    NoPriority,
    ImmediatePriority,
    UserBlockingPriority,
    NormalPriority,
    LowPriority,
    IdlePriority,
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
let currentTask: Task | null = null;
let currentPriorityLevel: PriorityLevel = PriorityLevel.NoPriority;

// 切片开始的时间
let startTime = -1;

// 切片时间段
let frameInterval = 5;

// 是否有 work 在执行
let isPerformingWork = false;

function cancelCallback() {
    if (currentTask) {
        currentTask.callback = null;
    }
}

function shouldYieldToHost() {
    return getCurrentTime() >= frameInterval;
}

function workLoop(initialTime: number) {
    let currentTime = initialTime;
    currentTask = taskQueue.peek();

    while (currentTask !== null) {
        if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
            break;
        }

        const callback = currentTask.callback;
        if (typeof callback === "function") {

        } else {
            taskQueue.pop();
        }

        currentTask = taskQueue.peek();
    }
}

