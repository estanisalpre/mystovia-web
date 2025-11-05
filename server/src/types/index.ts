export interface User {
  id: number;
  email: string;
  password: string;
  created_at: Date;
}

export interface Character {
  id: number;
  name: string;
  user_id: number;
  level: number;
  vocation: string;
  created_at: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateCharacterRequest {
  name: string;
  vocation: string;
}