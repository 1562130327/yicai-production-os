declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }
  export interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): void;
    export(): Uint8Array;
    close(): void;
  }
  export interface Statement {
    bind(params: any[] | Record<string, any>): void;
    step(): boolean;
    getAsObject(): Record<string, any>;
    free(): void;
    reset(): void;
  }
  export default function initSqlJs(): Promise<SqlJsStatic>;
}
