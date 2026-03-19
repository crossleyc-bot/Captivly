-- Fix Phase 4 RLS policies: add WITH CHECK constraints to prevent
-- unauthorized inserts/updates (the original policies only had USING clauses)

-- agency_members: tighten so only agency owners can insert/update/delete members
-- Regular members should only be able to SELECT
drop policy if exists "Agency members can view their agency membership" on public.agency_members;

-- SELECT: any member or the agency owner can view
create policy "Agency members can view memberships"
  on public.agency_members for select
  using (
    agency_id in (
      select id from public.agencies where owner_user_id = auth.uid()
    )
    or user_id = auth.uid()
  );

-- INSERT: only agency owners can add members
create policy "Agency owners can add members"
  on public.agency_members for insert
  with check (
    agency_id in (
      select id from public.agencies where owner_user_id = auth.uid()
    )
  );

-- UPDATE: only agency owners can update member roles
create policy "Agency owners can update members"
  on public.agency_members for update
  using (
    agency_id in (
      select id from public.agencies where owner_user_id = auth.uid()
    )
  )
  with check (
    agency_id in (
      select id from public.agencies where owner_user_id = auth.uid()
    )
  );

-- DELETE: only agency owners can remove members
create policy "Agency owners can remove members"
  on public.agency_members for delete
  using (
    agency_id in (
      select id from public.agencies where owner_user_id = auth.uid()
    )
  );
