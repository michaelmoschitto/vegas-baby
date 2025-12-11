import { createClient } from "@supabase/supabase-js";
import { describe, test, expect } from "bun:test";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe("Mezo ID Database Constraints", () => {
  const testCases = [
    // Valid cases
    { name: "valid1", id: "a123", shouldPass: true },
    { name: "valid2", id: "abc-123", shouldPass: true },
    { name: "valid3", id: "a12345678901234", shouldPass: true }, // 15 chars
    { name: "valid4", id: "z-123", shouldPass: true },
    { name: "valid5", id: "A", shouldPass: true }, // single letter
    { name: "valid6", id: "B1", shouldPass: true }, // letter + number
    { name: "valid7", id: "C-1", shouldPass: true }, // letter + hyphen + number
    { name: "valid8", id: "dE9-8F7", shouldPass: true }, // mixed case, hyphen, numbers
    { name: "valid9", id: "x1234567890123y", shouldPass: true }, // 15 chars, start/end letter
    { name: "valid10", id: "m-e-z-o-1", shouldPass: true }, // hyphens in middle
    { name: "valid11", id: "QWERTYUIOPASDFG", shouldPass: true }, // 15 uppercase letters
    { name: "valid12", id: "a1b2c3d4e5f6g7h", shouldPass: true }, // 15 chars, alternating

    // Invalid cases
    { name: "invalid1", id: "", shouldPass: false }, // Empty
    { name: "invalid2", id: "123a", shouldPass: false }, // Doesn't start with letter
    { name: "invalid3", id: "a123456789012345", shouldPass: false }, // Too long (16 chars)
    { name: "invalid4", id: "a-", shouldPass: false }, // Ends with hyphen
    { name: "invalid5", id: "a_123", shouldPass: false }, // Invalid character
    { name: "invalid6", id: "a0x123", shouldPass: false }, // Contains 0x
    { name: "invalid7", id: "bc1abc", shouldPass: false }, // Bitcoin magic string
    { name: "invalid8", id: "m123", shouldPass: false }, // m + numeric string
    { name: "invalid9", id: "apub123", shouldPass: false }, // Bitcoin magic string
    { name: "invalid10", id: "apriv123", shouldPass: false }, // Bitcoin magic string

    // More Bitcoin magic string invalid cases
    {
      name: "invalid11",
      id: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
      shouldPass: false,
    }, // bech32 address
    {
      name: "invalid12",
      id: "tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      shouldPass: false,
    }, // testnet bech32
    { name: "invalid13", id: "xpub661MyMwAqRbcF9", shouldPass: false }, // xpub
    { name: "invalid14", id: "ypub6Qqdgk5", shouldPass: false }, // ypub
    { name: "invalid15", id: "zpub6jftahh", shouldPass: false }, // zpub
    { name: "invalid16", id: "xpriv9s21ZrQH143K", shouldPass: false }, // xpriv
    { name: "invalid17", id: "ypriv9s21ZrQH143K", shouldPass: false }, // ypriv
    { name: "invalid18", id: "zpriv9s21ZrQH143K", shouldPass: false }, // zpriv
    // Looks like hex but not a magic string (should pass)
    { name: "valid13", id: "a1b2c3d4e5f6a7b", shouldPass: true }, // 15 chars, hex-like
    { name: "valid14", id: "b0b1b2b3b4b5b6b", shouldPass: true }, // 15 chars, hex-like
    // Edge valid: hyphen at start (should fail)
    { name: "invalid19", id: "-abc123", shouldPass: false },
    // Edge valid: hyphen at end (should fail)
    { name: "invalid20", id: "abc123-", shouldPass: false },
    // Edge valid: double hyphen in middle (should pass)
    { name: "valid15", id: "a--b--c--d--e", shouldPass: true },
    // Edge valid: all numbers after letter (should pass)
    { name: "valid16", id: "a1234567890123", shouldPass: true },
    // Edge valid: all hyphens (should fail)
    { name: "invalid21", id: "a--------------", shouldPass: false },
    // Edge valid: only numbers (should fail)
    { name: "invalid22", id: "123456789012345", shouldPass: false },
    // Edge valid: only hyphens (should fail)
    { name: "invalid23", id: "-", shouldPass: false },
  ];

  for (const testCase of testCases) {
    // For all but the explicit no-suffix test, append '.mezo' to the id
    const isNoSuffixTest = testCase.name === "noSuffix";
    const mezoId = isNoSuffixTest ? testCase.id : `${testCase.id}.mezo`;
    test(`Mezo ID "${mezoId}" should ${
      testCase.shouldPass ? "pass" : "fail"
    }`, async () => {
      const cardUid = `test-card-${testCase.name}`;
      try {
        const { error } = await supabase.from("card_activations").insert({
          card_uid: cardUid,
          mezo_id: mezoId,
          email: "test@example.com",
          activated: true,
        });

        if (testCase.shouldPass) {
          await supabase
            .from("card_activations")
            .delete()
            .eq("card_uid", cardUid);
        }

        if (!testCase.shouldPass && !error) {
          throw new Error(
            `Test failed: ID "${mezoId}" was accepted but should have been rejected`
          );
        }

        if (testCase.shouldPass && error) {
          throw new Error(
            `Test failed: ID "${mezoId}" was rejected but should have been accepted. Error: ${error.message}`
          );
        }

        expect(true).toBe(true);
      } catch (error) {
        throw error;
      }
    });
  }
  // Add a sanity check: ID without .mezo should fail
  test('Mezo ID "a123" without .mezo suffix should fail', async () => {
    const cardUid = "test-card-no-suffix";
    const mezoId = "a123";
    const { error } = await supabase.from("card_activations").insert({
      card_uid: cardUid,
      mezo_id: mezoId,
      email: "test@example.com",
      activated: true,
    });
    if (!error) {
      await supabase.from("card_activations").delete().eq("card_uid", cardUid);
      throw new Error(
        'Test failed: ID "a123" without .mezo was accepted but should have been rejected'
      );
    }
    expect(true).toBe(true);
  });
});
