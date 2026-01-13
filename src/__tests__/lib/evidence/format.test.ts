import { getStatusVariant } from "@/lib/evidence/format";

describe("evidence format status mapping", () => {
  it("maps only `verified` to success", () => {
    expect(getStatusVariant("verified")).toBe("success");
    expect(getStatusVariant("processing")).not.toBe("success");
    expect(getStatusVariant("connected")).not.toBe("success");
    expect(getStatusVariant("configured")).not.toBe("success");
    expect(getStatusVariant("degraded")).not.toBe("success");
    expect(getStatusVariant("error")).not.toBe("success");
  });
});

