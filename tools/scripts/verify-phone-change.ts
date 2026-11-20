import assert from 'assert';

const BASE_URL = 'http://localhost:3000/api/v1';

async function post(endpoint: string, data: any) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function get(endpoint: string) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  return res.json();
}

async function runTests() {
  console.log('========================================');
  console.log('🧪 BUILDORA 60 — SECURE PHONE CHANGE SUITE');
  console.log('========================================\n');

  // Test 1: Validation - Invalid phone number
  console.log('🔹 Test 1: Reject Invalid Phone Number');
  const invalidRes = await post('/customer/phone-change/initiate', { newPhone: '12345' });
  assert.strictEqual(invalidRes.success, false);
  console.log('✅ PASSED: Invalid phone rejected correctly\n');

  // Test 2: Validation - Same phone number
  console.log('🔹 Test 2: Reject Same Phone Number');
  const currentProfile = await get('/customer/profile');
  const sameRes = await post('/customer/phone-change/initiate', { newPhone: currentProfile.data.phone });
  assert.strictEqual(sameRes.success, false);
  console.log('✅ PASSED: Same phone number change rejected\n');

  // Test 3: Validation - Pre-registered number conflict
  console.log('🔹 Test 3: Reject Conflict / Already Registered Number');
  const conflictRes = await post('/customer/phone-change/initiate', { newPhone: '9111111111' });
  assert.strictEqual(conflictRes.success, false);
  console.log('✅ PASSED: Pre-registered number rejected\n');

  // Test 4: Initiation with valid 10-digit number
  console.log('🔹 Test 4: Initiate Secure Phone Change');
  const newTargetPhone = '97' + Math.floor(10000000 + Math.random() * 89999999);
  const initRes = await post('/customer/phone-change/initiate', { newPhone: newTargetPhone });
  assert.strictEqual(initRes.success, true);
  assert(initRes.sessionId, 'SessionId must be returned');
  assert(initRes.maskedOldPhone.startsWith('******'), 'Old phone must be masked');
  assert(initRes.maskedNewPhone.startsWith('******'), 'New phone must be masked');
  const sessionId = initRes.sessionId;
  console.log('✅ PASSED: Session created with masked numbers:', initRes.maskedOldPhone, '->', initRes.maskedNewPhone, '\n');

  // Test 5: Confirm blocked prematurely
  console.log('🔹 Test 5: Confirm Blocked Before Dual Verification');
  const earlyConfirm = await post('/customer/phone-change/confirm', { sessionId });
  assert.strictEqual(earlyConfirm.success, false);
  console.log('✅ PASSED: Premature confirmation safely rejected\n');

  // Test 6: Verify New number blocked before Old number verified
  console.log('🔹 Test 6: Verify New Number Blocked Before Old Verified');
  const skipOldRes = await post('/customer/phone-change/verify-new', { sessionId, otp: '6060' });
  assert.strictEqual(skipOldRes.success, false);
  console.log('✅ PASSED: Step sequence enforced strictly\n');

  // Test 7: Incorrect OTP attempt on Old number (rate limiting attempt count)
  console.log('🔹 Test 7: Incorrect OTP on Old Number');
  const badOtpRes = await post('/customer/phone-change/verify-old', { sessionId, otp: '999999' });
  assert.strictEqual(badOtpRes.success, false);
  assert(badOtpRes.message.includes('attempt'), 'Must show remaining attempts');
  console.log('✅ PASSED: Bad OTP handled with attempt tracking\n');

  // Test 8: Correct OTP on Old Number
  console.log('🔹 Test 8: Verify Old Number with Correct OTP');
  const goodOldRes = await post('/customer/phone-change/verify-old', { sessionId, otp: '6060' });
  assert.strictEqual(goodOldRes.success, true);
  assert.strictEqual(goodOldRes.maskedNewPhone, initRes.maskedNewPhone);
  console.log('✅ PASSED: Old number verified; new number OTP sent\n');

  // Test 9: Confirm still blocked after only 1 verification
  console.log('🔹 Test 9: Confirm Still Blocked After Only Old Verified');
  const halfConfirm = await post('/customer/phone-change/confirm', { sessionId });
  assert.strictEqual(halfConfirm.success, false);
  console.log('✅ PASSED: Single OTP confirmation strictly forbidden\n');

  // Test 10: Resend cooldown enforced
  console.log('🔹 Test 10: Resend Cooldown Enforced');
  const cooldownRes = await post('/customer/phone-change/resend', { sessionId, target: 'NEW' });
  assert.strictEqual(cooldownRes.success, false);
  assert(cooldownRes.message.includes('wait'), 'Must enforce cooldown');
  console.log('✅ PASSED: Resend cooldown active\n');

  // Test 11: Correct OTP on New Number
  console.log('🔹 Test 11: Verify New Number with Correct OTP');
  const goodNewRes = await post('/customer/phone-change/verify-new', { sessionId, otp: '6060' });
  assert.strictEqual(goodNewRes.success, true);
  assert.strictEqual(goodNewRes.readyForConfirmation, true);
  console.log('✅ PASSED: New number verified; ready for final confirmation\n');

  // Test 12: Final Confirmation & Database Update
  console.log('🔹 Test 12: Final Confirmation & Database Update');
  const finalRes = await post('/customer/phone-change/confirm', { sessionId });
  assert.strictEqual(finalRes.success, true);
  assert.strictEqual(finalRes.newPhone, newTargetPhone);
  console.log('✅ PASSED: Database updated to new phone number:', finalRes.newPhone, '\n');

  // Test 13: Verify User Profile Database has updated phone
  console.log('🔹 Test 13: Verify User Profile Persisted New Phone');
  const updatedProfile = await get('/customer/profile');
  assert.strictEqual(updatedProfile.data.phone, newTargetPhone);
  console.log('✅ PASSED: User profile verified with updated phone:', updatedProfile.data.phone, '\n');

  // Test 14: Verify Audit Trail Log
  console.log('🔹 Test 14: Verify Security Audit Log');
  const auditLogs = await get('/customer/phone-change/audit-logs');
  assert(auditLogs.data.length > 0, 'Audit log entry must be recorded');
  const lastLog = auditLogs.data[auditLogs.data.length - 1];
  assert.strictEqual(lastLog.sessionId, sessionId);
  assert.strictEqual(lastLog.action, 'PHONE_NUMBER_CHANGED');
  assert.strictEqual(lastLog.status, 'SUCCESS');
  console.log('✅ PASSED: Permanent audit log verified:', JSON.stringify(lastLog), '\n');

  console.log('========================================');
  console.log('🎉 ALL 14 SECURITY & BUSINESS LOGIC ASSERTIONS PASSED!');
  console.log('========================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
