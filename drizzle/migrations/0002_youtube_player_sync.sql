ALTER TABLE public.parties
  ADD COLUMN IF NOT EXISTS playback_position_seconds double precision NOT NULL DEFAULT 0 CHECK (playback_position_seconds >= 0 AND playback_position_seconds <= 86400),
  ADD COLUMN IF NOT EXISTS player_updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.party_snapshot(p_code text) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.parties;
BEGIN
  SELECT * INTO p FROM public.parties WHERE code=upper(trim(p_code));
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('id',p.id,'code',p.code,'name',p.name,'status',p.status,'playing',p.playing,'volume',p.volume,
    'playbackPositionSeconds',p.playback_position_seconds,'playerUpdatedAt',p.player_updated_at,
    'queue',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',q.id,'track',q.track,'requestedBy',q.requested_by,'state',q.state) ORDER BY q.position)
      FROM public.queue_entries q WHERE q.party_id=p.id AND q.state IN ('queued','current')),'[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.party_snapshot(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.party_snapshot(text) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.is_party_host(p_code text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.parties p WHERE p.code=upper(trim(p_code)) AND p.host_id=auth.uid() AND public.has_role(auth.uid(),'admin'))
$$;
REVOKE ALL ON FUNCTION public.is_party_host(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_party_host(text) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.sync_party_player(p_id uuid,p_video_id text,p_position_seconds double precision) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.parties; current_video_id text;
BEGIN
  SELECT * INTO p FROM public.parties WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR p.host_id IS DISTINCT FROM auth.uid() OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  IF p.status<>'ativa' THEN RAISE EXCEPTION 'Festa encerrada'; END IF;
  IF p_position_seconds IS NULL OR p_position_seconds<0 OR p_position_seconds>86400 OR p_video_id !~ '^[A-Za-z0-9_-]{11}$' THEN RAISE EXCEPTION 'Posição inválida'; END IF;
  SELECT q.track->>'id' INTO current_video_id FROM public.queue_entries q WHERE q.party_id=p_id AND q.state='current';
  IF current_video_id IS DISTINCT FROM p_video_id THEN RETURN; END IF;
  UPDATE public.parties SET playback_position_seconds=p_position_seconds,player_updated_at=now() WHERE id=p_id;
END $$;
REVOKE ALL ON FUNCTION public.sync_party_player(uuid,text,double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_party_player(uuid,text,double precision) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.control_party(p_id uuid,p_action text,p_value integer DEFAULT NULL,p_entry uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.parties; next_id uuid;
BEGIN
  SELECT * INTO p FROM public.parties WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR p.host_id IS DISTINCT FROM auth.uid() OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso não autorizado'; END IF;
  IF p.status<>'ativa' THEN RAISE EXCEPTION 'Festa encerrada'; END IF;
  IF p_action='end' THEN UPDATE public.parties SET status='encerrada',playing=false,player_updated_at=now() WHERE id=p_id;
  ELSIF p_action='volume' THEN
    IF p_value IS NULL OR p_value NOT BETWEEN 0 AND 100 THEN RAISE EXCEPTION 'Volume inválido'; END IF;
    UPDATE public.parties SET volume=p_value WHERE id=p_id;
  ELSIF p_action='toggle' THEN UPDATE public.parties SET playing=NOT playing,player_updated_at=now() WHERE id=p_id;
  ELSIF p_action='remove' THEN DELETE FROM public.queue_entries WHERE id=p_entry AND party_id=p_id AND state='queued';
  ELSIF p_action='skip' THEN
    UPDATE public.queue_entries SET state='done' WHERE party_id=p_id AND state='current';
    SELECT id INTO next_id FROM public.queue_entries WHERE party_id=p_id AND state='queued' ORDER BY position LIMIT 1;
    IF next_id IS NOT NULL THEN UPDATE public.queue_entries SET state='current' WHERE id=next_id; END IF;
    UPDATE public.parties SET playing=(next_id IS NOT NULL),playback_position_seconds=0,player_updated_at=now() WHERE id=p_id;
  ELSE RAISE EXCEPTION 'Ação inválida'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.control_party(uuid,text,integer,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.control_party(uuid,text,integer,uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.add_party_request(p_code text,p_track jsonb,p_nickname text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.parties; result uuid; video_id text; title_text text; channel_text text; duration_text text; thumbnail_text text; canonical jsonb;
BEGIN
  SELECT * INTO p FROM public.parties WHERE code=upper(trim(p_code)) FOR UPDATE;
  IF NOT FOUND OR p.status<>'ativa' THEN RAISE EXCEPTION 'Festa indisponível ou encerrada'; END IF;
  video_id:=COALESCE(p_track->>'videoId',p_track->>'id'); title_text:=trim(COALESCE(p_track->>'title',''));
  channel_text:=trim(COALESCE(p_track->>'channel','')); duration_text:=trim(COALESCE(p_track->>'duration','')); thumbnail_text:=COALESCE(p_track->>'thumbnail','');
  IF video_id !~ '^[A-Za-z0-9_-]{11}$' OR char_length(title_text) NOT BETWEEN 1 AND 120 OR char_length(channel_text) NOT BETWEEN 1 AND 120 OR char_length(duration_text)>12 THEN RAISE EXCEPTION 'Música inválida'; END IF;
  canonical:=jsonb_build_object('id',video_id,'videoId',video_id,'title',title_text,'channel',channel_text,'duration',duration_text,
    'thumbnail',CASE WHEN thumbnail_text LIKE 'https://i.ytimg.com/vi/'||video_id||'/%' THEN thumbnail_text ELSE 'https://i.ytimg.com/vi/'||video_id||'/mqdefault.jpg' END,
    'hue',COALESCE(NULLIF(p_track->>'hue','')::integer,210));
  INSERT INTO public.queue_entries(party_id,track,requested_by) VALUES(p.id,canonical,COALESCE(NULLIF(left(trim(p_nickname),20),''),'Convidado')) RETURNING id INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.add_party_request(text,jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_party_request(text,jsonb,text) TO anon,authenticated,service_role;
