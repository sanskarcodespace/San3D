# Managing the San3D catalogue

Complete [Supabase setup](supabase-setup.md), then sign in at `/admin/login`. Use your own account; do not share passwords or secret keys with the assistant. The Supabase dashboard login and your store's administrator Auth user are separate accounts.

## Create your first collection

Open **Categories**. Enter a name and SEO slug, an optional short label/description and display order. Upload an image if available and describe it in the alt-text field. Save the category. Lower display numbers appear first; the homepage shows the first four collections. An image-free category uses a neutral San3D placeholder.

## Add a product

1. Choose **Products → Add product** and enter its name, unique lowercase URL slug and descriptions.
2. Upload JPG, PNG or WebP files, up to 5 MiB each. Add meaningful alt text. Use the arrow buttons to reorder; the first image becomes the cover.
3. Add variants. Each needs a unique SKU, descriptive name, selling price, and stock/made-to-order setting. Colour, size and material help distinguish options. A compare-at price must be greater than the selling price.
4. Enter prices and costs as integer paise: ₹499 = `49900`, ₹1,250.50 = `125050`.
5. Assign a category and optional comma-separated tags. Set production lead days and personalisation rules. Private weight, time and cost estimates never appear in public product queries.
6. Save as **Draft** while preparing it. Use **Preview product** to inspect unsaved copy, photography, variants and prices.
7. Select **Published** and save, or use **Publish** from the product list after saving. Publication requires a category, detailed description, image/alt text and at least one priced variant with inventory settings.
8. Open the storefront in a new tab or reload it to confirm the result. No commit or redeployment is needed.

Use merchandising flags thoughtfully: **Featured** and **Bestseller** bring products into the homepage selection; only mark bestsellers when you can substantiate that label. The application does not invent sales rankings.

## Editing and image replacement

Changes take effect when you save. If another session changed the product, the save is rejected: reload to see the latest version before reapplying your edits. Keep the editor open until a save succeeds.

To replace an image, remove the old image, upload its replacement and save. Metadata is saved before old files are removed. Shared images remain protected if another product/category still references them. Unused uploads from abandoned edits can be deleted through **Media library**. Public catalogue assets, including draft images, must not contain private customer photos.

## Publication and removal

- **Unpublish** returns a product to draft and hides it from public queries.
- **Archive** hides it while retaining its content; confirmation is required.
- **Delete** permanently removes the product, variants and related metadata after confirmation. Audit records remain. Unused files can then be removed in Media.
- **Duplicate** makes a new draft with fresh variant IDs and SKUs, sharing the image files and resetting quantities to zero. Review everything before publishing.

The bag stores selections, not orders. Prices and available stock may change when the page reloads. Online checkout, payments and stock reservations are not enabled.

## Troubleshooting

- **Account not authorised:** confirm your Auth user UUID is present in `admin_roles` using the owner-run setup instructions.
- **Atomic migration required:** apply `202610100002_atomic_product_save.sql` once in Supabase SQL Editor.
- **Slug or SKU exists:** choose a unique value. Slugs use lowercase letters, numbers and single hyphens.
- **Image upload rejected:** use a valid, still JPG/PNG/WebP under 5 MiB and 25 million pixels. Renaming an unsupported file does not convert it.
- **Cannot delete image:** first remove every product/category reference and save those edits.
- **Session expired:** sign in again. The next protected action checks current membership, including revocation.

Password reset and administrator membership changes are handled by the Supabase project owner. This phase does not include a self-service account administration interface.
