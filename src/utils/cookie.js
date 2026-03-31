export const setCookies = (res, { accessToken, refreshToken }) => {
  res.cookie("access_token", accessToken, {
    httpOnly: true, // kalau true tidak diakases oleh frontend atau JS
    secure: true, // hanya bisa dipakai oleh https bukan http
    sameSite: "lax",
    maxAge: 60 * 60 * 1000,
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
