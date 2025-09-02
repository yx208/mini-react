import { describe, expect, it } from "vitest";
import { Node, SchedulerMinHeap } from "../src/SchedulerMinHeap";

describe("test min heap", () => {
    function createNode(value: number): Node {
        return { id: value, sortIndex: value };
    }

    function createHeap() {
        const heap = new SchedulerMinHeap();
        heap.push(createNode(3));
        heap.push(createNode(7));
        heap.push(createNode(4));
        heap.push(createNode(10));
        heap.push(createNode(12));
        heap.push(createNode(9));
        heap.push(createNode(6));
        heap.push(createNode(15));
        heap.push(createNode(14));

        return heap;
    }

    it("empty heap return null", () => {
        const heap = new SchedulerMinHeap();
        expect(heap.peek()).toBe(null);
    });

    it("heap pop and push and clear", () => {
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
