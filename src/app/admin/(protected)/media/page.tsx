import { requireAdminPage } from "@/features/admin/auth";
import { MediaList } from "@/features/admin/components/media-list";
export const metadata = { title: "Media library" };
export default async function MediaPage() {
  const { client } = await requireAdminPage();
  const paths: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await client.storage
      .from("catalogue-images")
      .list("catalogue", {
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
    if (error) throw new Error("Could not load media.");
    paths.push(...data.filter((i) => i.id).map((i) => `catalogue/${i.name}`));
    if (data.length < 100) break;
  }
  return (
    <>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">THE IMAGE LIBRARY</p>
          <h1>A considered collection.</h1>
          <p>
            Remove unused uploads here. Images linked to any product or category
            are protected from deletion.
          </p>
        </div>
      </header>
      <MediaList paths={paths} />
    </>
  );
}
