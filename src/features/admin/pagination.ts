import "server-only";
/** Do not silently truncate a catalogue at PostgREST's default row cap. */
export async function allRows<T>(
  query: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const rows: T[] = [];
  for (let from = 0; ; from += 100) {
    const result = await query(from, from + 99);
    if (result.error || !result.data)
      throw new Error("Could not load catalogue records.");
    rows.push(...result.data);
    if (result.data.length < 100) return rows;
  }
}
