export type Flags = number;

export const NoFlags = /*                      */ 0b00000000000000000000000000;
export const PerformedWork = /*                */ 0b00000000000000000000000001;

// DOM 需要插入到页面中
export const Placement = /*                    */ 0b00000000000000000000000010;
// DOM 需要更新
export const Update = /*                       */ 0b00000000000000000000000100;
// DOM需要删除
export const Deletion = /*                     */ 0b00000000000000000000001000;
// 需要删除子节点
export const ChildDeletion = /*                */ 0b00000000000000000000010000;

// 防止元素
export const Forked = /*                       */ 0b00000100000000000000000000;
