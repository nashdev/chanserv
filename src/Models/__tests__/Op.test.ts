import { Op } from "../Op";

describe("Ban Model", () => {
  it("should accept a banDTO", () => {
    const opDto = {
      id: "1",
      channelId: "C9XJA4DUJ",
      userId: "U04R6L0RV",
      createdAt: "2018-08-04 23:18:34.152029-05",
      updatedAt: "2018-08-04 23:18:34.152029-05"
    };
    const ban = new Op(opDto);
    expect(ban).toEqual(opDto);
  });
});
