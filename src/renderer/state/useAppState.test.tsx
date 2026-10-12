// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getState, updateState } from "./store";
import { useAppState } from "./useAppState";

function SelectionProbe({ path, onRender }: { path: string; onRender: () => void }) {
  onRender();
  const selected = useAppState((s) => s.selectedFilePath === path);
  return <span>{selected ? "on" : "off"}</span>;
}

describe("useAppState", () => {
  it("re-renders only the components whose selected value changed", () => {
    const renders = { a: 0, b: 0, c: 0 };
    render(
      <>
        <SelectionProbe path="a" onRender={() => (renders.a += 1)} />
        <SelectionProbe path="b" onRender={() => (renders.b += 1)} />
        <SelectionProbe path="c" onRender={() => (renders.c += 1)} />
      </>,
    );
    const afterMount = { ...renders };

    act(() => {
      updateState({ selectedFilePath: "a" });
    });
    act(() => {
      updateState({ selectedFilePath: "b" });
    });
    act(() => {
      updateState({ sidebarOpen: !getState().sidebarOpen });
    });

    expect(renders.a - afterMount.a).toBe(2);
    expect(renders.b - afterMount.b).toBe(1);
    expect(renders.c - afterMount.c).toBe(0);
  });

  it("does not notify when a write changes nothing", () => {
    const before = getState();
    updateState({ treeEpoch: before.treeEpoch });
    expect(getState()).toBe(before);
  });
});
