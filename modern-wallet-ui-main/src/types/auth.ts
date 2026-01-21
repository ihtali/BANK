export interface LoginSuccessResponse {
  success: true;
  data: {
    user_id: number;
    email: string;
  };
}

export interface LoginErrorResponse {
  success: false;
  error: string;
}
