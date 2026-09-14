import { handler, userId, quota } from "../_shared/http.ts";
import { callAi } from "../_shared/ai.ts";
import { preferences } from "../_shared/profile.ts";
import {
  refineInput,
  refineInstruction,
  refineOutput,
} from "../_shared/refine.ts";
Deno.serve((req) =>
  handler(req, async (body) => {
    const id = await userId(req);
    const { input, known } = refineInput(body);
    await quota(id, "ai-refine", 20, 3600);
    const traveler_profile = await preferences(req);
    const result = await callAi(refineInstruction, {
      ...input,
      traveler_profile,
    });
    return refineOutput(result, known);
  }),
);
