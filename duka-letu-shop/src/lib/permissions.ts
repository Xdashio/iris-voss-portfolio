import type { Role, Staff } from "@/types";

export type Permission =
  | "dashboard.view"
  | "orders.view"
  | "orders.manage"
  | "products.view"
  | "products.edit"
  | "products.delete"
  | "prices.view"
  | "prices.edit"
  | "inventory.view"
  | "inventory.adjust"
  | "pos.use"
  | "staff.manage"
  | "settings.manage";

const ROLE_PERMS: Record<Role, Permission[]> = {
  owner: [
    "dashboard.view", "orders.view", "orders.manage", "products.view", "products.edit", "products.delete",
    "prices.view", "prices.edit", "inventory.view", "inventory.adjust", "pos.use", "staff.manage", "settings.manage",
  ],
  cashier: ["orders.view", "orders.manage", "pos.use", "prices.view"],
  stock: ["products.view", "products.edit", "inventory.view", "inventory.adjust"],
};

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", cashier: "Cashier", stock: "Stock clerk" };
export const ROLE_SUMMARY: Record<Role, string> = {
  owner: "Everything: dashboard, orders, products and prices, inventory, POS, staff and settings.",
  cashier: "Point of sale and online orders.",
  stock: "Products and stock. Prices and sales figures are hidden.",
};

export function can(actor: Pick<Staff, "role" | "active"> | null | undefined, perm: Permission): boolean {
  if (!actor || !actor.active) return false;
  return ROLE_PERMS[actor.role].includes(perm);
}

export class PermissionError extends Error {
  constructor(perm: Permission) {
    super(`Your role does not allow this action (${perm}).`);
    this.name = "PermissionError";
  }
}

export function assertCan(actor: Staff | null | undefined, perm: Permission): asserts actor is Staff {
  if (!can(actor, perm)) throw new PermissionError(perm);
}

/** Staff routes, in sidebar order, with the permission needed to open each. */
export const STAFF_NAV = [
  { href: "/staff", label: "Dashboard", icon: "LayoutDashboard", perm: "dashboard.view" },
  { href: "/staff/orders", label: "Orders", icon: "ClipboardList", perm: "orders.view" },
  { href: "/staff/pos", label: "Point of sale", icon: "ScanBarcode", perm: "pos.use" },
  { href: "/staff/products", label: "Products", icon: "Boxes", perm: "products.view" },
  { href: "/staff/inventory", label: "Inventory", icon: "Warehouse", perm: "inventory.view" },
  { href: "/staff/team", label: "Staff", icon: "Users", perm: "staff.manage" },
  { href: "/staff/settings", label: "Settings", icon: "Settings", perm: "settings.manage" },
] as const satisfies ReadonlyArray<{ href: string; label: string; icon: string; perm: Permission }>;

export function homeFor(role: Role): string {
  return role === "owner" ? "/staff" : role === "cashier" ? "/staff/pos" : "/staff/inventory";
}
