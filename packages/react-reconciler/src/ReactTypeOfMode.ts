export const enum TypeOfMode {
    NoMode = /*                         */ 0b000000,
    // TODO: Remove ConcurrentMode by reading from the root tag instead
    ConcurrentMode = /*                 */ 0b000001,
    ProfileMode = /*                    */ 0b000010,
    DebugTracingMode = /*               */ 0b000100,
    StrictLegacyMode = /*               */ 0b001000,
    StrictEffectsMode = /*              */ 0b010000,
    ConcurrentUpdatesByDefaultMode = /* */ 0b100000
}
