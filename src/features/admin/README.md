# Admin feature boundary

Place product, inventory, order, and fulfillment management logic here. Keep route composition in `src/app/(admin)/admin` when implementation begins.

No admin route or authentication is implemented yet. Before exposing any dashboard, verify the authenticated user's role on the server for every read and mutation, and enforce corresponding database policies. A hidden navigation item or route group is not authorization.
