import assert from "node:assert/strict";

function jsonOrText(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function mutationReceipts(requests) {
  return Promise.all(
    requests.map(async (request) => {
      const response = await request.response();
      return {
        method: request.method(),
        url: request.url(),
        command: jsonOrText(request.postData()),
        status: response?.status() ?? null,
        receipt: response ? jsonOrText(await response.text()) : null,
      };
    }),
  );
}

export function assertResumeMutations(receipts, url, lessonIds) {
  assert.equal(
    receipts.length,
    lessonIds.length,
    "Only the expected prerequisite mutations occurred",
  );
  const mutationIds = new Set();
  for (const [
    index,
    { method, url: destination, command, status, receipt },
  ] of receipts.entries()) {
    assert.equal(method, "POST", "A prerequisite resume update uses POST");
    assert.equal(
      destination,
      `${url}/api/study`,
      "Only the owned study endpoint may receive the update",
    );
    assert.deepEqual(Object.keys(command).sort(), [
      "baseRevision",
      "expectedOwner",
      "key",
      "mutationId",
      "operation",
      "value",
    ]);
    assert.equal(command.operation, "write");
    assert.deepEqual(
      command.key,
      { kind: "resume" },
      "Prerequisites never save workspace answers",
    );
    assert.deepEqual(
      command.value,
      { lessonId: lessonIds[index] },
      "The resume value matches this prerequisite visit",
    );
    assert.equal(command.expectedOwner, "verification-a");
    assert.equal(typeof command.mutationId, "string");
    assert.ok(command.mutationId.length > 0);
    mutationIds.add(command.mutationId);
    assert.ok(
      Number.isSafeInteger(command.baseRevision) && command.baseRevision >= 0,
    );
    assert.equal(
      status,
      200,
      "The resume update receives a successful acknowledgement",
    );
    assert.equal(
      receipt?.user?.id,
      command.expectedOwner,
      "The acknowledgement belongs to the current account",
    );
    assert.equal(
      receipt?.record?.key,
      "resume",
      "The acknowledgement names the resume record",
    );
    assert.equal(
      receipt.record.mutationId,
      command.mutationId,
      "The acknowledgement matches the submitted mutation",
    );
    assert.deepEqual(
      receipt.record.value,
      command.value,
      "The acknowledgement preserves the exact resume value",
    );
  }
  assert.equal(
    mutationIds.size,
    lessonIds.length,
    "Each prerequisite has a distinct acknowledgement",
  );
}
