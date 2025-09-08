
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
