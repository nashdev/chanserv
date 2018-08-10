import { Ban } from "../Ban";
import moment from "moment";

describe("Ban Model", () => {
  it("should accept a banDTO", () => {
    const banDto = {
      id: "1",
      channelId: "C9XJA4DUJ",
      userId: "U04R6L0RV",
      reason: "You have been warned",
      expiresAt: "2018-08-07 13:48:16.956549-05",
      createdAt: "2018-08-04 23:18:34.152029-05",
      updatedAt: "2018-08-07 13:48:16.956549-05"
    };
    const ban = new Ban(banDto);
    expect(ban).toEqual(banDto);
  });

  it("#isExpired() should return true if the expiration date is in the past", () => {
    const ban = new Ban({
      id: "1",
      channelId: "C9XJA4DUJ",
      userId: "U04R6L0RV",
      reason: "You have been warned",
      expiresAt: "2018-08-07 13:48:16.956549-05",
      createdAt: "2018-08-04 23:18:34.152029-05",
      updatedAt: "2018-08-07 13:48:16.956549-05"
    });
    expect(ban.isExpired()).toBe(true);
  });

  it("#isExpired() should return false if the expiration date is in the future", () => {
    const ban = new Ban({
      id: "1",
      channelId: "C9XJA4DUJ",
      userId: "U04R6L0RV",
      reason: "You have been warned",
      expiresAt: moment()
        .add(30, "days")
        .format(),
      createdAt: "2018-08-04 23:18:34.152029-05",
      updatedAt: "2018-08-07 13:48:16.956549-05"
    });
    expect(ban.isExpired()).toBe(false);
  });
});
