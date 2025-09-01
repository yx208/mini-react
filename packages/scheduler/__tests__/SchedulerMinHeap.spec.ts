import {describe, expect, it} from "vitest";
import { Node, SchedulerMinHeap } from "../src/SchedulerMinHeap";

describe("test min heap", () => {
    function createNode(value: number): Node {
        return { id: value, sortIndex: value };
    }

    function createHeap() {
        let heap = new SchedulerMinHeap();
        heap.push({ id: 3, sortIndex: 3 });
        heap.push({ id: 7, sortIndex: 7 });
        heap.push({ id: 4, sortIndex: 4 });
        heap.push({ id: 10, sortIndex: 10 });
        heap.push({ id: 12, sortIndex: 12 });
        heap.push({ id: 9, sortIndex: 9 });
        heap.push({ id: 6, sortIndex: 6 });
        heap.push({ id: 15, sortIndex: 15 });
        heap.push({ id: 14, sortIndex: 14 });

        return heap;
    }

    it("empty heap return null", () => {
        let heap = new SchedulerMinHeap();
        expect(heap.peek()).toBe(null);
    });

    it("heap pop and push", () => {
        const heap = createHeap();
        expect(heap.peek().sortIndex).toBe(3);
        heap.pop();
        expect(heap.peek().sortIndex).toBe(4);
        heap.push(createNode(3));
        expect(heap.peek().sortIndex).toBe(3);
        heap.clear();
        expect(heap.pop()).toBe(null);
    });
});
