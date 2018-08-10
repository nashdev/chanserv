import { Channel } from "../Channel";
import moment from "moment";

describe("Channel Model", () => {
  it("should accept a channelDTO", () => {
    const c1Dto = {
      channelId: "C9XJA4DUJ",
      ownerId: "U04R6L0RV",
      name: "chanserv-dev",
      topic: "Chanserv Bot Development",
      purpose: "Chanserv Testing",
      ops: [],
      bans: [],
      warnings: [],
      createdAt: "2018-08-08 15:10:57.291305-05",
      updatedAt: "2018-08-08 15:10:57.291305-05"
    };
    const c1 = new Channel(c1Dto);
    expect(c1).toEqual(c1Dto);

    const c2 = new Channel({
      channelId: "C9XJA4DUJ",
      ownerId: "U04R6L0RV",
      name: "chanserv-dev",
      topic: "Chanserv Bot Development",
      purpose: "Chanserv Testing",
      createdAt: "2018-08-08 15:10:57.291305-05",
      updatedAt: "2018-08-08 15:10:57.291305-05"
    });
    expect(c2.ops).toEqual([]);
    expect(c2.warnings).toEqual([]);
    expect(c2.bans).toEqual([]);
  });

  it("#checkPermissions", () => {
    const channel = new Channel({
      channelId: "C9XJA4DUJ",
      ownerId: "UXXXTEST1",
      name: "chanserv-dev",
      topic: "Chanserv Bot Development",
      purpose: "Chanserv Testing",
      ops: ["UXXXTEST2"],
      bans: ["UXXXTEST3"],
      warnings: ["UXXXTEST4"],
      createdAt: "2018-08-08 15:10:57.291305-05",
      updatedAt: "2018-08-08 15:10:57.291305-05"
    });

    const p1 = channel.getPermissions({
      id: "UXXXTEST1",
      is_admin: false
    });

    const p2 = channel.getPermissions({
      id: "UXXXTEST2",
      is_admin: false
    });

    const p3 = channel.getPermissions({
      id: "UXXXTEST3",
      is_admin: false
    });

    const p4 = channel.getPermissions({
      id: "UXXXTEST4",
      is_admin: false
    });

    expect(p1.isOwner).toBe(true);
    expect(p1.isOp).toBe(false);
    expect(p1.isBanned).toBe(false);
    expect(p1.isWarned).toBe(false);
    expect(p1.isAdmin).toBe(false);

    expect(p2.isOwner).toBe(false);
    expect(p2.isOp).toBe(true);
    expect(p2.isBanned).toBe(false);
    expect(p2.isWarned).toBe(false);
    expect(p2.isAdmin).toBe(false);

    expect(p3.isOwner).toBe(false);
    expect(p3.isOp).toBe(false);
    expect(p3.isBanned).toBe(true);
    expect(p3.isWarned).toBe(false);
    expect(p3.isAdmin).toBe(false);

    expect(p4.isOwner).toBe(false);
    expect(p4.isOp).toBe(false);
    expect(p4.isBanned).toBe(false);
    expect(p4.isWarned).toBe(true);
    expect(p4.isAdmin).toBe(false);
  });
});
