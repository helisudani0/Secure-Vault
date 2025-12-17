import { getCurrentUser } from "../api/auth";

export function isAuthenticated() {
  return !!getCurrentUser();
}
