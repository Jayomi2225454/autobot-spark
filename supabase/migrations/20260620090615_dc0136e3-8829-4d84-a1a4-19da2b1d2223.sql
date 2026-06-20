
-- Replace permissive WITH CHECK(true) with auth-required checks
DROP POLICY IF EXISTS "Authenticated create leads" ON public.leads;
CREATE POLICY "Authenticated create leads" ON public.leads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated insert messages" ON public.messages;
CREATE POLICY "Authenticated insert messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated insert events" ON public.message_events;
CREATE POLICY "Authenticated insert events" ON public.message_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Lock down SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
