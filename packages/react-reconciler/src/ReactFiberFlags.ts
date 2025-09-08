export enum Flags {
    NoFlags = /*                      */ 0b00000000000000000000000000,
    PerformedWork = /*                */ 0b00000000000000000000000001,

    // You can change the rest (and add more).
    Placement = /*                    */ 0b00000000000000000000000010,
    Update = /*                       */ 0b00000000000000000000000100,
    Deletion = /*                     */ 0b00000000000000000000001000,
    ChildDeletion = /*                */ 0b00000000000000000000010000,
}
