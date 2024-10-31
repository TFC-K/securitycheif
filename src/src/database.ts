import Sqlite3 from 'better-sqlite3';

export default new class Database {
    public db: Sqlite3.Database = <any>{};

    constructor() {
        this.db = new Sqlite3('database.db');
    }
}