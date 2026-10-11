"use client";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { imageUrl } from "./images";
export function MediaList({ paths }: { paths: string[] }) {
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <p role="status">{message}</p>
      <div className="admin-media-grid">
        {paths.map((path) => (
          <div className="admin-panel" key={path}>
            <Image
              unoptimized
              src={imageUrl(path)}
              alt="Catalogue media asset"
              width={240}
              height={240}
            />
            <small>{path.split("/")[1]}</small>
            <button
              disabled={pending}
              className="admin-danger"
              onClick={() => {
                if (
                  !window.confirm(
                    "Permanently delete this unused file? Referenced images are protected.",
                  )
                )
                  return;
                start(async () => {
                  const response = await fetch("/api/admin/images", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path }),
                  });
                  const data = await response.json();
                  setMessage(response.ok ? "Image deleted." : data.error);
                  router.refresh();
                });
              }}
            >
              Delete unused file
            </button>
          </div>
        ))}
      </div>
      {!paths.length && <p className="admin-empty">No uploaded media yet.</p>}
    </>
  );
}
