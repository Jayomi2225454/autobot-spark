import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role");
    const rolesByUser = new Map<string, string[]>();
    (roles ?? []).forEach((r) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    return {
      members: (profiles ?? []).map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] })),
    };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(["admin", "manager", "sales_executive"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // verify caller is admin
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.user_id, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { templates: data ?? [] };
  });

export const upsertTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().min(1).max(120),
        language: z.string().min(2).max(10),
        body: z.string().max(2000).optional(),
        is_default: z.boolean().default(false),
        is_active: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.is_default) {
      await supabaseAdmin.from("templates").update({ is_default: false }).neq("id", data.id ?? "00000000-0000-0000-0000-000000000000");
    }
    const { error } = await supabaseAdmin.from("templates").upsert({
      id: data.id,
      name: data.name,
      language: data.language,
      body: data.body ?? null,
      is_default: data.is_default,
      is_active: data.is_active,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
