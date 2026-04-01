const prisma = require("../db/prisma");
const env = require("../config/env");
const { createSupabaseClient } = require("../lib/supabase");
const AppError = require("../utils/app-error");

async function signup(payload) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        name: payload.name,
      },
      ...(env.SUPABASE_AUTH_REDIRECT_URL
        ? { emailRedirectTo: env.SUPABASE_AUTH_REDIRECT_URL }
        : {}),
    },
  });

  if (error) {
    throw mapSupabaseAuthError(error, 409);
  }

  if (!data.user) {
    throw new AppError("Supabase signup did not return a user.", 502);
  }

  const localUser = await syncLocalUser({
    id: data.user.id,
    email: data.user.email,
    name: data.user.user_metadata?.name || payload.name,
  });

  return buildAuthResponse(localUser, data.session);
}

async function login(payload) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw mapSupabaseAuthError(error, 401);
  }

  if (!data.user) {
    throw new AppError("Supabase login did not return a user.", 502);
  }

  const localUser = await syncLocalUser({
    id: data.user.id,
    email: data.user.email,
    name: data.user.user_metadata?.name || payload.email.split("@")[0],
  });

  return buildAuthResponse(localUser, data.session);
}

async function getAuthenticatedUser(accessToken) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new AppError("Invalid or expired Supabase access token.", 401);
  }

  const localUser = await syncLocalUser({
    id: data.user.id,
    email: data.user.email,
    name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
  });

  return sanitizeUser(localUser);
}

async function syncLocalUser({ id, email, name }) {
  const existingUserWithEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUserWithEmail && existingUserWithEmail.id !== id) {
    throw new AppError(
      "A local user with this email already exists with a different auth identity. Clear old local data before switching auth providers.",
      409
    );
  }

  return prisma.user.upsert({
    where: { id },
    update: {
      email,
      name,
      passwordHash: null,
    },
    create: {
      id,
      email,
      name,
      passwordHash: null,
    },
  });
}

function buildAuthResponse(user, session) {
  return {
    user: sanitizeUser(user),
    session: session
      ? {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at,
          expiresIn: session.expires_in,
          tokenType: session.token_type,
        }
      : null,
    requiresEmailConfirmation: !session,
  };
}

function mapSupabaseAuthError(error, fallbackStatusCode) {
  const message = error?.message || "Authentication failed.";
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return new AppError("Invalid email or password.", 401);
  }

  if (normalizedMessage.includes("user already registered")) {
    return new AppError("A user with this email already exists.", 409);
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return new AppError("Please verify your email address before logging in.", 401);
  }

  return new AppError(message, fallbackStatusCode);
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

module.exports = {
  signup,
  login,
  getAuthenticatedUser,
};
