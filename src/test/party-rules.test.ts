import {describe,it,expect} from 'vitest';
import {guestNickname,validCode,normalizeCode} from '@/lib/party-rules';
describe('guest access',()=>{it('accepts party codes without an account',()=>{expect(validCode(' abc123 ')).toBe(true);expect(normalizeCode(' abc123 ')).toBe('ABC123');expect(validCode('../admin')).toBe(false);});it('makes nickname optional',()=>{expect(guestNickname('')).toBe('Convidado');expect(guestNickname(' Ana ')).toBe('Ana');});});
