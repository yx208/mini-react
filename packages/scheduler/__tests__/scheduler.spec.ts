import {describe, expect, test} from "vitest";
import { isStr } from "shared/utils";

describe("scheduler", () => {
    test("test", () => {
        expect(isStr(1)).toBe(false);
        expect(isStr("1")).toBe(true);
    });
});
