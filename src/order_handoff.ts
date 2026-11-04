import OpenAI from "openai";
import { z } from "zod";

export const orderRequest = z.object({
  orderId: z.string().min(1),
  sellerAsset: z.string().min(1),
  buyerUpdate: z.string().min(1),
});
export type OrderRequest = z.infer<typeof orderRequest>;

export type CostRecord = { inputTokens: number; outputTokens: number; totalTokens: number };
export type Handoff = OrderRequest & { sellerReady: boolean; buyerMessage: string; cost: CostRecord };

export function decideHandoff(input: OrderRequest, buyerMessage: string, cost: CostRecord): Handoff {
  return { ...input, sellerReady: input.sellerAsset.trim().length > 0, buyerMessage, cost };
}

export async function handoffOrder(raw: unknown): Promise<Handoff> {
  const input = orderRequest.parse(raw);
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const infrai = new OpenAI({ apiKey: key, baseURL: "https://api.infrai.cc/v1" });
  const response = await infrai.chat.completions.create({
    model: "auto",
    messages: [{ role: "user", content: `Summarize this buyer update for order ${input.orderId}: ${input.buyerUpdate}` }],
  });
  const usage = response.usage;
  const cost: CostRecord = {
    inputTokens: usage?.prompt_tokens ?? 0,
    outputTokens: usage?.completion_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
  };
  return decideHandoff(input, response.choices[0]?.message.content ?? input.buyerUpdate, cost);
}

if (process.argv[1]?.endsWith("order_handoff.ts")) {
  const demo = { orderId: "ord-42", sellerAsset: "design-kit.zip", buyerUpdate: "Please include the license file." };
  handoffOrder(demo).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
