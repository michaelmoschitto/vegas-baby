import { createClient } from "@supabase/supabase-js";
import { describe, test, expect, beforeAll, afterAll } from "bun:test";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe("Email Validation and Uniqueness", () => {
  const testCases = [
    // Valid cases
    { name: "valid1", email: "test@example.com", shouldPass: true },
    { name: "valid2", email: "user.name@domain.com", shouldPass: true },
    { name: "valid3", email: "user+tag@example.com", shouldPass: true },
    { name: "valid4", email: "user-name@domain.co.uk", shouldPass: true },
    { name: "valid5", email: "123@domain.com", shouldPass: true },
    { name: "valid6", email: "user@subdomain.domain.com", shouldPass: true },
    { name: "valid7", email: "user.name+tag@domain.com", shouldPass: true },
    { name: "valid8", email: "a@b.com", shouldPass: true }, // Minimal valid email
    { name: "valid9", email: "user@domain.technology", shouldPass: true },
    { name: "valid10", email: "user_name@domain.com", shouldPass: true },

    // Invalid cases
    { name: "invalid1", email: "", shouldPass: false }, // Empty
    { name: "invalid2", email: "notanemail", shouldPass: false }, // No @
    { name: "invalid3", email: "@domain.com", shouldPass: false }, // No local part
    { name: "invalid4", email: "user@", shouldPass: false }, // No domain
    { name: "invalid5", email: "user@domain", shouldPass: false }, // No TLD
    { name: "invalid6", email: "user space@domain.com", shouldPass: false }, // Contains space
    { name: "invalid7", email: "user@domain..com", shouldPass: false }, // Double dot
    { name: "invalid8", email: ".user@domain.com", shouldPass: false }, // Starts with dot
    { name: "invalid9", email: "user@.domain.com", shouldPass: false }, // Dot after @
    { name: "invalid10", email: "user@@domain.com", shouldPass: false }, // Double @
  ];

  // Clean up any test data before running tests
  beforeAll(async () => {
    await supabase
      .from("card_activations")
      .delete()
      .like("card_uid", "test-email-%");
  });

  // Test email validation and uniqueness
  for (const testCase of testCases) {
    test(`Email "${testCase.email}" should ${
      testCase.shouldPass ? "pass" : "fail"
    }`, async () => {
      const cardUid = `test-email-${testCase.name}`;
      try {
        const { error } = await supabase.from("card_activations").insert({
          card_uid: cardUid,
          mezo_id: `${testCase.name}.mezo`,
          email: testCase.email,
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
            `Test failed: Email "${testCase.email}" was accepted but should have been rejected`
          );
        }

        if (testCase.shouldPass && error) {
          throw new Error(
            `Test failed: Email "${testCase.email}" was rejected but should have been accepted. Error: ${error.message}`
          );
        }

        expect(true).toBe(true);
      } catch (error) {
        throw error;
      }
    });
  }

  // Test email uniqueness
  test("Email uniqueness constraint should prevent duplicate emails", async () => {
    const email = "unique.test@example.com";
    const cardUid1 = "test-email-unique1";
    const cardUid2 = "test-email-unique2";

    try {
      // First insertion should succeed
      const { error: error1 } = await supabase.from("card_activations").insert({
        card_uid: cardUid1,
        mezo_id: "unique1.mezo",
        email: email,
        activated: true,
      });

      expect(error1).toBeNull();

      // Second insertion with same email should fail
      const { error: error2 } = await supabase.from("card_activations").insert({
        card_uid: cardUid2,
        mezo_id: "unique2.mezo",
        email: email,
        activated: true,
      });

      expect(error2).not.toBeNull();
      expect(error2?.message).toContain("unique");

      // Clean up
      await supabase
        .from("card_activations")
        .delete()
        .in("card_uid", [cardUid1, cardUid2]);
    } catch (error) {
      throw error;
    }
  });

  // Clean up all test data after tests
  afterAll(async () => {
    await supabase
      .from("card_activations")
      .delete()
      .like("card_uid", "test-email-%");
  });
});
