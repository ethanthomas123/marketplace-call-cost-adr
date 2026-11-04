import assert from "node:assert/strict";
import { decideHandoff, orderRequest } from "./order_handoff.js";

const input = orderRequest.parse({ orderId: "ord-1", sellerAsset: "bundle.zip", buyerUpdate: "Add setup notes" });
const handoff = decideHandoff(input, "Buyer requests setup notes.", { inputTokens: 12, outputTokens: 7, totalTokens: 19 });
assert.equal(handoff.sellerReady, true);
assert.equal(handoff.cost.totalTokens, 19);
assert.equal(handoff.buyerMessage, "Buyer requests setup notes.");
console.log("handoff decision and token ledger pass");
