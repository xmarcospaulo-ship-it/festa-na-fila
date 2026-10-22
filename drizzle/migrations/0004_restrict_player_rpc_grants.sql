REVOKE EXECUTE ON FUNCTION public.control_party(uuid,text,integer,uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_party_player(uuid,text,double precision) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.control_party(uuid,text,integer,uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_party_player(uuid,text,double precision) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;