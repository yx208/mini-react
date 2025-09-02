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

    it('task that finishes before deadline', async () => {
        const logArray = ["Message"];
        scheduleCallback(PriorityLevel.NormalPriority, () => {
            logArray.push("Task");
            expect(logArray).toEqual(['Message', "Task"]);
        });
        expect(logArray).toEqual(['Message']);
        await vi.runOnlyPendingTimersAsync();
        await vi.runAllTimersAsync();
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
        await vi.runOnlyPendingTimersAsync();
        await vi.runAllTimersAsync();
    });

    it('cancels tasks', async () => {
        const logArray = ["Message"];
        const task = scheduleCallback(PriorityLevel.NormalPriority, () => {
            logArray.push("Task");
            expect(logArray).toEqual(["Message", "Task"]);
        });
        cancelCallback(task);
        expect(logArray).toEqual(["Message"]);
        await vi.runOnlyPendingTimersAsync();
        await vi.runAllTimersAsync();
        expect(logArray).toEqual(["Message"]);
    });


});
