import { inngest } from "@/app/inngest/client";

import { serve } from "inngest/next";
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [],
});
