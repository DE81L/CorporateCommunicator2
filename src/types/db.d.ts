declare namespace Database {
  interface Config {
    user: string;
    host: string;
    database: string;
    password: string;
    port: number;
  }
}

export = Database;
