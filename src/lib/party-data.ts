import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getParty } from './party.functions';
import type { QueueItem } from './types';
export type PartySnapshot = { id: string; code: string; name: string; status: 'ativa' | 'encerrada'; playing: boolean; volume: number; queue: { id: string; track: Omit<QueueItem,'queueId'|'requestedBy'>; requestedBy: string; state: string }[] };
export const partyOptions = (code: string) => queryOptions({ queryKey: ['party',code], queryFn: () => getParty({data:{code}}), refetchInterval: 2000 });
export function queueItems(party: PartySnapshot, state: string): QueueItem[] { return party.queue.filter(q=>q.state===state).map(q=>({...q.track,queueId:q.id,requestedBy:q.requestedBy})); }
export async function hostAccess() { const {data,error}=await supabase.auth.getUser(); if(error || !data.user) return false; const roles=await supabase.from('user_roles').select('role').eq('user_id',data.user.id); return roles.data?.some(r=>r.role==='admin') ?? false; }
export const inputCls='min-h-14 w-full rounded-2xl border border-input bg-secondary px-4 text-lg outline-none focus:ring-2 focus:ring-ring';
