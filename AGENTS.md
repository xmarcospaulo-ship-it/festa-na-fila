<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep host privileges in protected user_roles, assigned only from verified Auth identity; never infer permissions from editable metadata.
- Guest party snapshots and requests use narrowly granted RPCs; direct tables are host-only to avoid exposing all parties.
- Serialize guest requests and host queue controls on the party row to preserve shared ordering and closed-party behavior.
- Keep public guest routes separate from client-only authenticated administration, and use public server functions for SSR snapshots.
- Revoke EXECUTE on SECURITY DEFINER RPCs from anon and PUBLIC explicitly; Supabase default privileges grant anon EXECUTE on newly created public functions, so revoking from PUBLIC alone leaves guests able to call host-only RPCs.
