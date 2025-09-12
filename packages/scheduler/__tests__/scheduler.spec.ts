import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
    cancelCallback, ImmediatePriority, NormalPriority,
    scheduleCallback, UserBlockingPriority,
} from "../src";


describe("SchedulerBrowser", () => {
    beforeEach(async () => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    async function waitForSchedule() {
        await vi.runOnlyPendingTimersAsync();
        await vi.runAllTimersAsync();
    }

    it('task that finishes before deadline', async () => {
        const logArray = ["Message"];
        scheduleCallback(NormalPriority, () => {
            logArray.push("Task");
        });
        expect(logArray).toEqual(['Message']);
        await waitForSchedule();
        expect(logArray).toEqual(['Message', "Task"]);
    });

    it('multiple tasks', async () => {
        const logArray = ["Message"];
        scheduleCallback(NormalPriority, () => {
            logArray.push("Task");
        });
        scheduleCallback(NormalPriority, () => {
            logArray.push("Task2");
        });
        expect(logArray).toEqual(['Message']);
        await waitForSchedule();
        expect(logArray).toEqual(['Message', "Task", "Task2"]);
    });

    it('cancels tasks', async () => {
        const logArray = ["Message"];
        const task = scheduleCallback(NormalPriority, () => {
            logArray.push("Task");
        });
        cancelCallback(task);
        expect(logArray).toEqual(["Message"]);
        await waitForSchedule();
        expect(logArray).toEqual(["Message"]);
    });

    it('priority tasks', async () => {
        const logArray = ["Message"];
        scheduleCallback(NormalPriority, () => {
            logArray.push("NormalPriority");
        });
        scheduleCallback(ImmediatePriority, () => {
            logArray.push("ImmediatePriority");
        });
        scheduleCallback(UserBlockingPriority, () => {
            logArray.push("UserBlockingPriority");
        });
        expect(logArray).toEqual(["Message"]);
        await waitForSchedule();
        expect(logArray).toEqual(["Message", "ImmediatePriority", "UserBlockingPriority", "NormalPriority"]);
    });
});
