import bcrypt from "bcrypt";
import * as repo from "./auth.repository.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";

export const signup = async (data) => {
  const existing = await repo.findUserByEmail(data.email);
  if (existing) throw new Error("Email already used");

  const hash = await bcrypt.hash(data.password, 10);

  const user = await repo.createUser({
    name: data.name,
    email: data.email,
    password: hash,
  });

  return await createSession(user);
};

export const signin = async (data) => {
  const user = await repo.findUserByEmail(data.email);
  if (!user) throw new Error("Invalid credentials");

  const isBcryptHash = user.password?.startsWith("$2");
  const valid = isBcryptHash
    ? await bcrypt.compare(data.password, user.password)
    : data.password === user.password;

  if (!valid) throw new Error("Invalid credentials");

  // Backward-compatible migration for seeded plaintext passwords.
  if (!isBcryptHash) {
    const hash = await bcrypt.hash(data.password, 10);
    await repo.updatePassword(user.id, hash);
  }

  return await createSession(user);
};

// GOOGLE LOGIN (dipanggil dari passport callback)
export const googleLogin = async (profile) => {
  const email = profile.emails[0].value;

  let user = await repo.findUserByEmail(email);

  if (!user) {
    user = await repo.createUser({
      name: profile.displayName ?? "Google User",
      email,
      password: "",
    });
  }

  return await createSession(user);
};

// SESSION CREATION (CORE)
export const createSession = async (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user, accessToken, refreshToken };
};

// REFRESH TOKEN ROTATION
export const refreshToken = async (oldToken) => {
  const payload = verifyRefreshToken(oldToken);
  const user = await repo.findUserById(payload.id);
  if (!user) throw new Error("User not found");

  return await createSession(user);
};

// UPDATE PROFILE
export const updateMe = async (userId, data) => {
  let updatedData = { ...data };

  // hash password jika ada
  if (data.password) {
    updatedData.password = await bcrypt.hash(data.password, 10);
  }

  return await repo.updateUser(userId, updatedData);
};

// REMOVE SESSION (LOGOUT)
export const removeSession = async () => {
  // Stateless JWT refresh token: cookie clear on client is enough.
  return;
};

export const getUser = async (id) => {
  const user = await repo.findUserById(id);
  if (!user) throw new Error("User not found");

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};
