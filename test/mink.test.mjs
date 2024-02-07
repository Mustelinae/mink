import { expect } from "chai";
import { afterEach, beforeEach, describe, it } from "mocha";

import MK from "../dist/cjs.js";

const testFuncs = {};

const includeSetupAndTeardown = () => {
  beforeEach(() => {
    // for testing basic single patch-unpatch
    testFuncs.simple = (a, b) => a + b;

    // now we know that works, for testing context
    testFuncs.contextual = function (a) {
      expect(this?.x).not.to.be.undefined;
      expect(this.y).not.to.be.undefined;
      expect(this.z).not.to.be.undefined;
      return (this.x - a) / this.y + this.z;
    };

    // now we know patching works, for testing patch composing
    testFuncs.passthru = (a) => a;
  });

  afterEach(MK.unpatchAll);
};

describe("mink after patches", () => {
  includeSetupAndTeardown();

  it("should patch a simple func", () => {
    MK.after("simple", testFuncs, ([, b], ret) => ret * b);

    expect(testFuncs.simple(1, 2)).to.equal(6);
  });

  it("should be unpatchable", () => {
    const unpatch = MK.after("simple", testFuncs, () => 0);

    unpatch();

    expect(testFuncs.simple(1, 2)).to.equal(3);
  });

  it("should maintain context", () => {
    MK.after("contextual", testFuncs, function () {
      expect(this?.x).to.be.equal(17);
      expect(this.y).to.be.equal(5);
      expect(this.z).to.be.equal("test");
    });

    const ctxt = { x: 17, y: 5, z: "test" };

    expect(testFuncs.contextual.call(ctxt, 1)).to.equal("3.2test");
  });
});

describe("mink before patches", () => {
  includeSetupAndTeardown();

  it("should patch a simple func", () => {
    MK.before("simple", testFuncs, ([a, b]) => [a + b, a * b]);

    expect(testFuncs.simple(1, 2)).to.equal(5);
  });

  it("should be unpatchable", () => {
    const unpatch = MK.before("simple", testFuncs, () => [0, 0]);

    unpatch();

    expect(testFuncs.simple(1, 2)).to.equal(3);
  });

  it("should maintain context", () => {
    MK.before("contextual", testFuncs, function () {
      expect(this?.x).to.be.equal(17);
      expect(this.y).to.be.equal(5);
      expect(this.z).to.be.equal("test");
    });

    const ctxt = { x: 17, y: 5, z: "test" };

    expect(testFuncs.contextual.call(ctxt, 1)).to.equal("3.2test");
  });
});

describe("mink instead patches", () => {
  includeSetupAndTeardown();

  it("should patch a simple func", () => {
    MK.instead("simple", testFuncs, ([a, b], orig) => orig(a + b, b - a) * b);

    expect(testFuncs.simple(1, 2)).to.equal(8);
  });

  it("should be unpatchable", () => {
    const unpatch = MK.instead("simple", testFuncs, () => 0);

    unpatch();

    expect(testFuncs.simple(1, 2)).to.equal(3);
  });

  it("should maintain context", () => {
    MK.instead("contextual", testFuncs, function (args, orig) {
      expect(this?.x).to.be.equal(17);
      expect(this.y).to.be.equal(5);
      expect(this.z).to.be.equal("test");

      return orig.apply(this, args);
    });

    const ctxt = { x: 17, y: 5, z: "test" };

    expect(testFuncs.contextual.call(ctxt, 1)).to.equal("3.2test");
  });
});

describe("mink unpatches", () => {
  includeSetupAndTeardown();

  it("should be able to unpatch the most recent on a given func", () => {
    MK.after("passthru", testFuncs, ([], ret) => ret + "a");
    const unpatch = MK.after("passthru", testFuncs, ([], ret) => ret + "b");

    unpatch();
    expect(testFuncs.passthru("x_")).to.equal("x_a");
  });

  it("should be able to unpatch the first on a given func", () => {
    const unpatch = MK.after("passthru", testFuncs, ([], ret) => ret + "a");
    MK.after("passthru", testFuncs, ([], ret) => ret + "b");

    unpatch();
    expect(testFuncs.passthru("x_")).to.equal("x_b");
  });

  it("should be able to unpatch an in-between on a given func", () => {
    MK.after("passthru", testFuncs, ([], ret) => ret + "a");
    const unpatch = MK.after("passthru", testFuncs, ([], ret) => ret + "b");
    MK.after("passthru", testFuncs, ([], ret) => ret + "c");

    unpatch();
    expect(testFuncs.passthru("x_")).to.equal("x_ac");
  });

  it("should be able to completely unpatch", () => {
    MK.before("simple", testFuncs, ([a, b]) => [a + 1, b + 1]);
    MK.after("simple", testFuncs, ([], ret) => ret / 2);

    MK.after("passthru", testFuncs, ([], ret) => ret + "_patched");

    MK.instead("contextual", testFuncs, ([a], orig) =>
      orig.call({ x: 1, y: 1, z: "a" }, a - 4)
    );

    MK.unpatchAll();

    const ctxt = { x: 17, y: 5, z: "test" };

    expect(testFuncs.simple(1, 2)).to.equal(3);
    expect(testFuncs.contextual.call(ctxt, 1)).to.equal("3.2test");
    expect(testFuncs.passthru("x")).to.equal("x");
  });
});
