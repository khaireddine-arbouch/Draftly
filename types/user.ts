// Type definition for the raw data fetched from Convex
export type ConvexUserRaw = {
  _creationTime: number;
  _id: string;
  email: string;
  emailVerificationTime?: number;
  image?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  onboardedAt?: number;
  lastLoginAt?: number;
};

// Type definition for the normalized profile
export type Profile = {
  id: string; // normalized from _id
  createdAtMs: number; // normalized from _creationTime
  email: string;
  emailVerifiedAtMs?: number; // normalized from emailVerificationTime
  image?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  onboardedAt?: number;
  lastLoginAt?: number;
};

// Normalizes the raw Convex user data into a cleaner profile
export const normalizeProfile = (raw: ConvexUserRaw | null): Profile | null => {
  if (!raw) {
    return null; // Return null if there's no raw profile data
  }

  // Extracts the name from the email
  const extractNameFromEmail = (email: string): string => {
    const username = email.split("@")[0];
    return username.split(/[._]/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  };

  const providedName = raw.name?.trim();
  const inferredName = [raw.firstName, raw.lastName].filter(Boolean).join(" ").trim();
  const name = providedName || inferredName || extractNameFromEmail(raw.email);

  // Normalize and map fields
  return {
    id: raw._id, // Normalizing _id to id
    createdAtMs: raw._creationTime, // Normalizing _creationTime to createdAtMs
    email: raw.email, // Email stays the same
    emailVerifiedAtMs: raw.emailVerificationTime, // Optional, if exists
    image: raw.image, // Optional, if exists
    name,
    firstName: raw.firstName,
    lastName: raw.lastName,
    onboardedAt: raw.onboardedAt,
    lastLoginAt: raw.lastLoginAt,
  };
};
