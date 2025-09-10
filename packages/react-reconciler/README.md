
## 双缓存树

React 使用双缓存结构储存 Fiber 树，当前屏幕上显示内容对应的 Fiber 树称为 `current` Fiber 树，正在内存中构建的 Fiber 树称为 `workInProgress` Fiber 树。

Current tree: 存储在 `fiberRoot.current`，WorkInProgress tree: 存储在 `fiberRoot.current.alternate` 中。

每次状态更新都会产生新的 workInProgress Fiber 树，React 会解析组件返回的 JSX 并在内存中依次创建 Fiber 节点连接成 Fiber 树，内存中完成构建的 Fiber 树叫做 workInProgress Fiber 树。

流程如下：
1. 渲染阶段
    - 调用 `prepareFreshStack` 重置一些信息
    - React 遍历 current tree，为每个节点调用 createWorkInProgress 创建对应的 workInProgress fiber node
2. 构建新树：这些 workInProgress fiber nodes 通过父子、兄弟关系连接，形成完整的 workInProgress tree
3. 提交阶段：HostRoot 节点开始指向 workInProgress tree，这实际上使 workInProgress tree 成为 current tree（因为它具有应用程序的最新状态）。之前的 current tree 成为新的 workInProgress tree，以便 React 可以重用其中的节点

## ensureRootIsScheduled

确保 React 的根节点（Root）有一个调度任务在执行或等待执行

如果某个任务已被安排，我们将检查现有任务的优先级，以确保其优先级与根节点正在处理的下一级任务的优先级相同
每次更新时以及退出任务之前都会调用此函数

1. React 18 引入了并发特性，不同更新有不同优先级（如用户输入优先级高于数据获取），ensureRootIsScheduled 确保高优先级任务能够打断低优先级任务
2. 通过检查现有的调度任务和优先级，避免为相同优先级的更新创建多个调度任务，提高性能
3. 多个更新可能在短时间内触发，这个函数会将它们合并到一个调度任务中，实现自动批处理
4. 对于并发任务，通过 Scheduler 调度，支持时间切片（Time Slicing），让浏览器有机会处理用户输入和其他高优先级任务
5. 无论是 setState、forceUpdate 还是其他触发更新的方式，最终都会调用这个函数，提供了一个统一的调度管理点

## completeUnitOfWork

它的主要职责是在 render 阶段处理已完成工作的 Fiber 节点，并决定下一个要处理的工作单元。在遍历的时候 使用深度优先遍历。



