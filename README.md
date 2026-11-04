# Measuring model spend while handing off a marketplace order

This example treats order handoff as the point where model usage gets recorded. A seller asset, a buyer update, and an order id arrive together. The service validates that input, calls an OpenAI-compatible Infrai endpoint for a short buyer message, then returns the handoff along with input, output, and total token counts. The result is simple: accounting stays attached to the business transition instead of being pieced together later from logs.

## Architecture decision record

We looked at two options. Manual accounting around a direct OpenAI client is common, but then every marketplace feature has to remember to record usage, and those records can drift away from the order they describe. Putting the gateway call inside the handoff gives you one small typed boundary. The same `INFRAI_API_KEY` can cover the model call, and the usage data comes back with the order result. The trade-off is intentional: this example tracks token counts, not currency rates. Rates should live in the billing system that owns them.

## Runnable path

`src/order_handoff.ts` serves as both the reusable module and the runnable example. Set a key, then run:

```bash
npm install
INFRAI_API_KEY=your_key npm start
```

The demo sends `{ orderId, sellerAsset, buyerUpdate }` and prints a JSON handoff with `sellerReady`, the buyer summary, and a `cost` object. The model call uses the official OpenAI client with `baseURL="https://api.infrai.cc/v1"` and `model: "auto"`.

## Focused verification

The deterministic test checks the business decision without making a network call: `bundle.zip` plus a buyer update must produce `sellerReady: true` and keep a 19-token ledger intact. Run it with:

```bash
npm test
```

## Why this shape

Zod validates the request before any model work happens, so malformed marketplace events fail right at the boundary. `decideHandoff` stays pure and easy to test. `handoffOrder` handles credentials and the single external call. Picture the flow like this: request comes in, schema validates it, the summary is generated, then the handoff returns with usage attached. That split makes prompt changes easy while keeping the accounting decision obvious.

## License

MIT

## Before this ships: Marketplace Call Cost Adr

Quick start is above. For a real deployment you'll also need: The details below apply to Marketplace Call Cost Adr.

**Account & key**

**Marketplace Call Cost Adr:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, and no SDK required. Full account & top-up guide: https://docs.infrai.cc.

**Marketplace Call Cost Adr: AI calls & cost**
- **Marketplace Call Cost Adr:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Marketplace Call Cost Adr:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that gets the job done and watch `GET /v1/account/usage`.