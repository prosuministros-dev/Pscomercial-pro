const SUPABASE_URL = 'https://jmevnusslcdaldtzymax.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTA0NywiZXhwIjoyMDg2Mzk3MDQ3fQ.wKV4lYFfcyywBG2q2qBo0g4usEGBdKCikaGXdKX_iRw';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptZXZudXNzbGNkYWxkdHp5bWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjEwNDcsImV4cCI6MjA4NjM5NzA0N30.CCGILUaLNsmwgT5MbffinKOpNJV0Jy5_0xg1yTNCOyg';

// Use the Supabase Management API to run SQL
const PROJECT_REF = 'jmevnusslcdaldtzymax';
const PAT = 'sbp_d01c4f7f58e0cf420318b4614f59872aa6267323';

const sql = `
CREATE OR REPLACE FUNCTION generate_consecutive(
  org_uuid uuid,
  entity_type varchar
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  next_number integer;
  start_number integer;
BEGIN
  start_number := CASE entity_type
    WHEN 'lead' THEN 100
    WHEN 'quote' THEN 30000
    WHEN 'order' THEN 20000
    ELSE 1
  END;

  -- Thread-safe: advisory lock prevents race conditions
  PERFORM pg_advisory_xact_lock(hashtext(org_uuid::text || entity_type));

  IF entity_type = 'lead' THEN
    SELECT COALESCE(MAX(lead_number), start_number - 1) + 1
    INTO next_number
    FROM leads
    WHERE organization_id = org_uuid;
  ELSIF entity_type = 'quote' THEN
    SELECT COALESCE(MAX(quote_number), start_number - 1) + 1
    INTO next_number
    FROM quotes
    WHERE organization_id = org_uuid;
  ELSIF entity_type = 'order' THEN
    SELECT COALESCE(MAX(order_number), start_number - 1) + 1
    INTO next_number
    FROM orders
    WHERE organization_id = org_uuid;
  ELSE
    RAISE EXCEPTION 'Invalid entity_type: %. Must be lead, quote, or order', entity_type;
  END IF;

  RETURN next_number;
END;
$func$;

COMMENT ON FUNCTION generate_consecutive IS 'Thread-safe consecutive number generator using advisory locks. Leads start at #100, quotes at #30000, orders at #20000.';
GRANT EXECUTE ON FUNCTION generate_consecutive TO authenticated;
`;

async function main() {
  // Deploy via Supabase Management API
  console.log('Deploying fixed generate_consecutive function...');

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  console.log('Deploy status:', res.status);
  const data = await res.text();
  console.log('Deploy response:', data.substring(0, 500));

  // Now test the function
  console.log('\nTesting generate_consecutive...');
  const testRes = await fetch(SUPABASE_URL + '/rest/v1/rpc/generate_consecutive', {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      org_uuid: 'bee5aac6-a830-4857-b608-25b1985c8d82',
      entity_type: 'lead'
    })
  });

  console.log('Test status:', testRes.status);
  const testData = await testRes.text();
  console.log('Test response:', testData);

  if (testRes.ok) {
    console.log('\nSUCCESS: generate_consecutive is now working! Next lead number:', testData);
  } else {
    console.log('\nFAILED: Still broken after fix');
  }
}

main().catch(console.error);
