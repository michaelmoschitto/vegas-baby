import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "bun:test";
import React from "react";

// Extend expect with jest-dom matchers
declare module "bun:test" {
  interface Matchers<T> {
    toBeInTheDocument(): T;
  }
}

import { CardActivationForm } from "./card-activation-form";
import { withAppRouter } from "./test-utils";

const validCases: string[] = [
  "a123.mezo",
  "abc-123.mezo",
  "a12345678901234.mezo",
  "z-123.mezo",
  "A.mezo",
  "B1.mezo",
  "C-1.mezo",
  "dE9-8F7.mezo",
  "x1234567890123y.mezo",
  "m-e-z-o-1.mezo",
  "QWERTYUIOPASDFG.mezo",
  "a1b2c3d4e5f6g7h.mezo",
];

type InvalidCase = { id: string; error: string };
const invalidCases: InvalidCase[] = [
  { id: "", error: "Mezo ID must end with .mezo" },
  { id: "123a.mezo", error: "Mezo ID must start with a letter" },
  {
    id: "a123456789012345.mezo",
    error: "Mezo ID must be 15 characters or less (excluding .mezo)",
  },
  {
    id: "a-.mezo",
    error:
      "Mezo ID can only contain letters, numbers, and hyphens, and must end with a letter or number",
  },
  {
    id: "a_123.mezo",
    error:
      "Mezo ID can only contain letters, numbers, and hyphens, and must end with a letter or number",
  },
  { id: "a0x123.mezo", error: "Mezo ID cannot contain '0x'" },
  {
    id: "bc1abc.mezo",
    error: "Mezo ID cannot start with Bitcoin-related prefixes",
  },
  {
    id: "m123.mezo",
    error: "Mezo ID cannot start with 'm' followed by numbers",
  },
  {
    id: "apub123.mezo",
    error: "Mezo ID cannot start with Bitcoin-related prefixes",
  },
  { id: "a123", error: "Mezo ID must end with .mezo" },
];

describe("CardActivationForm Mezo ID validation", () => {
  it.each(validCases)("accepts valid Mezo ID: %s", async (mezoId: string) => {
    render(withAppRouter(<CardActivationForm />));
    const input = screen.getByLabelText(/mezo id/i);
    await userEvent.clear(input);
    await userEvent.type(input, mezoId);
    await userEvent.tab(); // Trigger blur
    // Should not show any error message
    expect(
      screen.queryByText(/mezo id.*required|must|cannot/i)
    ).not.toBeInTheDocument();
  });

  it.each(invalidCases)(
    "shows error for invalid Mezo ID: %s",
    async ({ id, error }: InvalidCase) => {
      render(withAppRouter(<CardActivationForm />));
      const input = screen.getByLabelText(/mezo id/i);

      if (id === "") {
        await userEvent.clear(input);
      } else {
        await userEvent.clear(input);
        await userEvent.type(input, id);
      }
      await userEvent.tab(); // Trigger blur to validate

      // Wait for the error message to appear
      await waitFor(() => {
        expect(screen.getByText(error)).toBeInTheDocument();
      });
    }
  );
});
