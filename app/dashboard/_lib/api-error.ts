// Shape of the errors thrown by the lib/apiCalling* helpers and axios.
export interface ApiErrorLike {
  message?: string;
  errors?: string[];
  response?: { data?: { message?: string } };
}

// Narrow an unknown catch value so its optional fields can be read safely.
export function toApiError(error: unknown): ApiErrorLike {
  return typeof error === "object" && error !== null ? error : {};
}
