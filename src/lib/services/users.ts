import { requestJson } from "./http";

export interface UserProfile {
  username: string;
  isAdmin: boolean;
}

export interface UsersPayload {
  users: UserProfile[];
}

export async function getUserProfile(username: string): Promise<UserProfile> {
  return requestJson<UserProfile>(`/users/${encodeURIComponent(username)}/profile`);
}

export async function getUsers(): Promise<UserProfile[]> {
  const payload = await requestJson<UsersPayload>("/users");
  return payload.users;
}
