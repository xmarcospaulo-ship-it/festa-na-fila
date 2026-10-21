export function normalizeCode(code: string) { return code.trim().toUpperCase(); }
export function validCode(code: string) { return /^[A-Z0-9]{6}$/.test(normalizeCode(code)); }
export function guestNickname(nickname: string) { return nickname.trim().slice(0,20) || 'Convidado'; }
