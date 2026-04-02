/**
 * Service autentikasi sederhana berbasis email + pin.
 */
function authLogin_(payload) {
  const email = String(payload.email || '').trim().toLowerCase();
  const pin = String(payload.pin || '').trim();

  if (!email || !pin) throw new Error('Email dan PIN wajib diisi.');

  const users = readRows_('User_Akses');
  const user = users.find((u) =>
    String(u.email || '').toLowerCase() === email &&
    String(u.pin_kasir || '') === pin
  );

  if (!user) throw new Error('Email atau PIN salah.');
  if (!toBooleanFlag_(user.is_active)) throw new Error('User tidak aktif.');

  return {
    token: Utilities.base64EncodeWebSafe(JSON.stringify({
      user_id: user.user_id,
      role: user.role,
      cabang_id: user.cabang_id,
      login_at: nowIso_()
    })),
    user: {
      user_id: user.user_id,
      nama_user: user.nama_user,
      email: user.email,
      role: user.role,
      cabang_id: user.cabang_id
    }
  };
}

function decodeToken_(token) {
  if (!token) return null;
  try {
    const raw = Utilities.newBlob(Utilities.base64DecodeWebSafe(token)).getDataAsString();
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function getSessionUser_(payload) {
  const session = decodeToken_(payload.token);
  if (!session) throw new Error('Token tidak valid.');

  const user = findById_('User_Akses', 'user_id', session.user_id);
  if (!user) throw new Error('User session tidak ditemukan.');
  return user;
}
