DROP POLICY IF EXISTS "Admins delete leads" ON public.leads;

CREATE POLICY "Authenticated users can delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);