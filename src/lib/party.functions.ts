import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type { PartySnapshot } from './party-data';
export const getParty = createServerFn({method:'GET'}).inputValidator((data:{code:string})=>data).handler(async({data})=>{
 const url=process.env['SUPABASE_URL']; const key=process.env['SUPABASE_PUBLISHABLE_KEY'];
 if(!url || !key) throw new Error('Serviço indisponível');
 const client=createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const headers=new Headers(init?.headers); if(headers.get('Authorization')===`Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey',key); return fetch(input,{...init,headers});}}});
 const result=await client.rpc('party_snapshot',{p_code:data.code}); if(result.error) throw new Error('Não foi possível carregar a festa.'); return result.data as unknown as PartySnapshot|null;
});
