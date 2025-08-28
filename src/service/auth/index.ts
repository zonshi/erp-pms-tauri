import { getDatabase } from '../../db';

export interface User {
  id: number;
  username: string;
  password: string;
}
export const login = async (username: string, password: string) => {
  const database = await getDatabase();

  const data = await database.select<User[]>('SELECT * FROM users where username = $1 AND password = $2', [username, password]);

  if (!data) {
    return null;
  }
  
  return data;
};