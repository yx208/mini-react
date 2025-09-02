import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
    cancelCallback,
    scheduleCallback,
    PriorityLevel
} from "../src/Scheduler";

describe("SchedulerBrowser", () => {
    beforeEach(async () => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.clearAllTimers()
    })

    async function waitForSchedule() {
        await vi.runOnlyPendingTimersAsync();
        await vi.runAllTimersAsync();
    }

    it('task that finishes before deadline', async () => {
        const logArray = ["Message"];
        scheduleCallback(PriorityLevel.NormalPriority, () => {
            logArray.push("Task");
            expect(logArray).toEqual(['Message', "Task"]);
        });
        expect(logArray).toEqual(['Message']);
        await waitForSchedule();
    });

    it('multiple tasks', async () => {
        const logArray = ["Message"];
        scheduleCallback(PriorityLevel.NormalPriority, () => {
            logArray.push("Task");
            expect(logArray).toEqual(['Message', "Task"]);
        });
        scheduleCallback(PriorityLevel.NormalPriority, () => {
            logArray.push("Task2");
            expect(logArray).toEqual(['Message', "Task", "Task2"]);
        });
        expect(logArray).toEqual(['Message']);
        await waitForSchedule();
    });

    it('cancels tasks', async () => {
        const logArray = ["Message"];
        const task = scheduleCallback(PriorityLevel.NormalPriority, () => {
            logArray.push("Task");
            expect(logArray).toEqual(["Message", "Task"]);
        });
        cancelCallback(task);
        expect(logArray).toEqual(["Message"]);
        await waitForSchedule();
        expect(logArray).toEqual(["Message"]);
    });

    it('priority tasks', async () => {
        const logArray = ["Message"];
        scheduleCallback(PriorityLevel.NormalPriority, () => {
            logArray.push("NormalPriority");
        });
        scheduleCallback(PriorityLevel.ImmediatePriority, () => {
            logArray.push("ImmediatePriority");
        });
        scheduleCallback(PriorityLevel.UserBlockingPriority, () => {
            logArray.push("UserBlockingPriority");
        });
        expect(logArray).toEqual(["Message"]);
        await waitForSchedule();
        expect(logArray).toEqual(["Message", "ImmediatePriority", "UserBlockingPriority", "NormalPriority"]);
    });
});
