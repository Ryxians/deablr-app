import { describe, expect, it } from "vitest"
import { groupByCategory } from "./wishlist"

const categories = [
  { categoryId: "kitchen", name: "Kitchen" },
  { categoryId: "office", name: "Office" },
]

describe("groupByCategory", () => {
  it("keeps Category order, then Misc, preserving Item order", () => {
    const groups = groupByCategory(categories, [
      { id: "desk", categoryId: "office" },
      { id: "kite", categoryId: null },
      { id: "oven", categoryId: "kitchen" },
      { id: "fridge", categoryId: "kitchen" },
    ])
    expect(groups.map((g) => [g.name, g.items.map((i) => i.id)])).toEqual([
      ["Kitchen", ["oven", "fridge"]],
      ["Office", ["desk"]],
      ["Misc", ["kite"]],
    ])
  })

  it("includes empty groups", () => {
    expect(groupByCategory(categories, []).map((g) => g.items.length)).toEqual([
      0, 0, 0,
    ])
  })

  it("puts an Item with an unknown Category in Misc", () => {
    const groups = groupByCategory([], [{ categoryId: "gone" }])
    expect(groups).toHaveLength(1)
    expect(groups[0].items).toHaveLength(1)
  })
})
