export type Node = {
    id: number;
    sortIndex: number;
};

export class SchedulerMinHeap<T extends Node> {
    heap: Array<T> = [];

    peek(): T | null {
        return this.heap.length === 0 ? null : this.heap[0];
    }

    push(node: T) {
        const index = this.heap.length;
        this.heap.push(node);
        this.siftUp(node, index);
    }

    // 从下往上堆化
    private siftUp(node: T, pos: number) {
        let index = pos;
        while (index > 0) {
            // Math.floor((index - 1) / 2)
            const parentIndex = index - 1 >>> 1;
            const parent = this.heap[parentIndex];

            if (this.compare(parent, node) > 0) {
                this.heap[parentIndex] = node;
                this.heap[index] = parent;
                index = parentIndex;
            } else {
                return;
            }
        }
    }

    private compare(a: T, b: T) {
        const diff = a.sortIndex - b.sortIndex;
        return diff !== 0 ? diff : a.id - b.id;
    }

    pop(): T | null {
        if (this.heap.length === 0) {
            return null;
        }

        const firstNode = this.heap[0];
        const lastNode = this.heap.pop();

        if (firstNode !== lastNode) {
            this.heap[0] = lastNode;
            this.siftDown(lastNode, 0);
        }

        return firstNode;
    }

    private siftDown(node: T, pos: number) {
        let index = pos;
        const length = this.heap.length;
        const halfLength = this.heap.length >>> 1;
        while (index < halfLength) {
            const leftIndex = 2 * index + 1;
            const leftNode = this.heap[leftIndex];
            const rightIndex = leftIndex + 1;
            const rightNode = this.heap[rightIndex];

            if (this.compare(node, leftNode) >= 0) {
                // node >= left >= right
                if (rightIndex < length && this.compare(leftNode, rightNode) >= 0) {
                    this.heap[index] = rightNode;
                    this.heap[rightIndex] = node;
                    index = rightIndex;
                } else {
                    this.heap[index] = leftNode;
                    this.heap[leftIndex] = node;
                    index = leftIndex;
                }
            } else if (rightIndex < halfLength && this.compare(node, rightNode) >= 0) {
                // 走到 else-if 说明小于 node
                this.heap[index] = rightNode;
                this.heap[rightIndex] = node;
                index = rightIndex;
            } else {
                return;
            }
        }
    }

    clear() {
        this.heap = [];
    }
}
