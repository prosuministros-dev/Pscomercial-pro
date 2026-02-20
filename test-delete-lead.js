/**
 * test-delete-lead.js
 * Tests the DELETE /api/leads endpoint
 */

const SUPABASE_URL = "https://jmevnusslcdaldtzymax.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjEwNDcsImV4cCI6MjA4NjM5NzA0N30.CCGILUaLNsmwgT5MbffinKOpNJV0Jy5_0xg1yTNCOyg";
const PROJECT_REF = "jmevnusslcdaldtzymax";
const API_BASE = "http://localhost:3000/api";

async function login(email, password) {
  const res = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Login failed: " + JSON.stringify(data));
  return data;
}

function buildAuthCookies(session) {
  const sessionJson = JSON.stringify(session);
  const b64 = Buffer.from(sessionJson, "utf-8").toString("base64url");
  const encoded = "base64-" + b64;
  const CHUNK_SIZE = 3180;
  const cookieName = "sb-" + PROJECT_REF + "-auth-token";
  const uriEncoded = encodeURIComponent(encoded);
  if (uriEncoded.length <= CHUNK_SIZE) {
    return cookieName + "=" + encoded;
  }
  const chunks = [];
  let remaining = encoded;
  while (remaining.length > 0) {
    let end = remaining.length;
    while (encodeURIComponent(remaining.substring(0, end)).length > CHUNK_SIZE) {
      end = Math.floor(end * 0.9);
    }
    chunks.push(remaining.substring(0, end));
    remaining = remaining.substring(end);
  }
  return chunks.map((chunk, i) => cookieName + "." + i + "=" + chunk).join("; ");
}

function authHeaders(session) {
  return { "Content-Type": "application/json", Cookie: buildAuthCookies(session) };
}

function printSection(title) {
  console.log("\n" + "=".repeat(60));
  console.log("  " + title);
  console.log("=".repeat(60));
}

function printResult(label, status, body) {
  const icon = (status >= 200 && status < 300) ? "[OK]" : "[!!]";
  console.log("\n" + icon + " " + label);
  console.log("    Status : " + status);
  console.log("    Body   : " + JSON.stringify(body, null, 2).split("\n").join("\n             "));
}

async function tryDeleteConverted(session, lead) {
  console.log("  Found Lead #100:");
  console.log("    id            : " + lead.id);
  console.log("    business_name : " + lead.business_name);
  console.log("    status        : " + lead.status);
  const delRes = await fetch(API_BASE + "/leads?id=" + lead.id, {
    method: "DELETE", headers: authHeaders(session),
  });
  const delBody = await delRes.json();
  printResult("DELETE /api/leads?id=" + lead.id, delRes.status, delBody);
  const pass = delRes.status === 400;
  console.log("\n  Expected: 400 { error: \"No se puede eliminar un lead convertido\" }");
  console.log("  Result  : " + (pass ? "PASS" : "FAIL"));
  return pass ? "PASS" : "FAIL";
}

async function main() {
  const results = {};

  // Step 1 - Login
  printSection("STEP 1: Login as admin@prosutest.com");
  const session = await login("admin@prosutest.com", "TestPscom2026!");
  console.log("  Access token obtained (" + session.access_token.substring(0, 20) + "...)");
  console.log("  User ID: " + session.user.id);
  results.step1 = "PASS";

  // Step 2 - Create a disposable lead
  printSection("STEP 2: Create a new lead for deletion test");
  const createRes = await fetch(API_BASE + "/leads", {
    method: "POST",
    headers: authHeaders(session),
    body: JSON.stringify({
      business_name: "DELETE TEST LEAD",
      nit: "999888777-0",
      contact_name: "Delete Test",
      phone: "+57 300 999 0000",
      email: "deletetest@test.com",
      requirement: "Test delete functionality",
      channel: "manual",
    }),
  });
  const createBody = await createRes.json();
  printResult("POST /api/leads (create disposable lead)", createRes.status, createBody);
  if (!createRes.ok) {
    console.error("\nCannot proceed without a created lead. Aborting.");
    process.exit(1);
  }
  const newLeadId = createBody.data?.id;
  const newLeadNumber = createBody.data?.lead_number;
  console.log("\n  Created lead id     : " + newLeadId);
  console.log("  Created lead_number : " + newLeadNumber);
  results.step2 = "PASS";

  // Step 3 - Delete the disposable lead
  printSection("STEP 3: DELETE the newly created lead");
  const deleteRes = await fetch(API_BASE + "/leads?id=" + newLeadId, {
    method: "DELETE", headers: authHeaders(session),
  });
  const deleteBody = await deleteRes.json();
  printResult("DELETE /api/leads?id=" + newLeadId, deleteRes.status, deleteBody);
  const step3Pass = deleteRes.status === 200 && deleteBody.success === true;
  console.log("\n  Expected: 200 { success: true }");
  console.log("  Result  : " + (step3Pass ? "PASS" : "FAIL"));
  results.step3 = step3Pass ? "PASS" : "FAIL";

  // Verify the lead is no longer returned in GET
  const verifyRes = await fetch(API_BASE + "/leads?search=DELETE+TEST+LEAD", {
    headers: authHeaders(session),
  });
  const verifyBody = await verifyRes.json();
  const stillVisible = (verifyBody.data || []).some((l) => l.id === newLeadId);
  console.log("\n  Verify soft-deleted lead no longer appears in GET:");
  console.log("    Found in results: " + stillVisible);
  console.log("    Result          : " + (!stillVisible ? "PASS" : "FAIL"));
  results.step3b = !stillVisible ? "PASS" : "FAIL";

  // Step 4 - Find Lead #100 and try to delete it
  printSection("STEP 4: Attempt to DELETE converted Lead #100 (should fail with 400)");
  const searchRes = await fetch(API_BASE + "/leads?limit=200", {
    headers: authHeaders(session),
  });
  const searchBody = await searchRes.json();
  let lead100 = (searchBody.data || []).find((l) => l.lead_number === 100);
  if (!lead100) {
    console.log("  Lead #100 not found in default listing. Trying status=converted...");
    const convRes = await fetch(API_BASE + "/leads?status=converted&limit=200", {
      headers: authHeaders(session),
    });
    const convBody = await convRes.json();
    lead100 = (convBody.data || []).find((l) => l.lead_number === 100);
  }
  if (!lead100) {
    console.log("  WARNING: Lead #100 not found. Listing first 10 leads for debugging:");
    (searchBody.data || []).slice(0, 10).forEach((l) =>
      console.log("    #" + l.lead_number + " - " + l.business_name + " (" + l.status + ")")
    );
    results.step4 = "SKIPPED";
  } else {
    results.step4 = await tryDeleteConverted(session, lead100);
  }

  // Summary
  printSection("TEST SUMMARY");
  console.log("  Step 1  (Login)                     : " + results.step1);
  console.log("  Step 2  (Create lead)               : " + results.step2);
  console.log("  Step 3  (Delete new lead)           : " + results.step3);
  console.log("  Step 3b (Verify soft delete in GET) : " + results.step3b);
  console.log("  Step 4  (Delete converted blocked)  : " + results.step4 + "\n");
  const allPassed = Object.values(results).every((v) => v === "PASS");
  console.log(allPassed ? "  ALL TESTS PASSED" : "  SOME TESTS FAILED OR SKIPPED");
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => { console.error("\nFATAL ERROR:", err); process.exit(1); });
