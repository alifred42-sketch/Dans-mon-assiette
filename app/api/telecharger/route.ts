import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
  const file = await readFile(join(process.cwd(), "public", "Dans-mon-assiette.xlsx"));
  return new Response(file, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Dans-mon-assiette.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
