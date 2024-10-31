import database from '../database';
import { UserFlags } from './interfaces';
import bcrypt from 'bcrypt';

export default class User {
    private _flags: UserFlags = <UserFlags>0;
    public readonly userId: number = 0;

    private _passwordHash: string = <any>{};
    private _email: string = <any>{}; 
    private _twoFactorSecret = <any>{};
    private _websites = <string[]>{};

    private constructor(id: number, email: string, passwordHash: string, flags: number, twoFactorSecret: string | null, websites: string) {
        this.userId = id;
        this._email = email;
        this._flags = <UserFlags>flags;
        this._twoFactorSecret = twoFactorSecret;
        this._websites = JSON.parse(websites);
        this._passwordHash = passwordHash;
    }

    public get flags() {
        return this._flags;
    }

    public set flags(newFlags: UserFlags) {
        database.db.prepare('UPDATE users SET flags=? WHERE id=?').run(<number>newFlags, this.userId);
        this._flags = newFlags;
    }

    public get websites() {
        return this._websites;
    }

    public set websites(newWebsites: string[]) {
        database.db.prepare('UPDATE users SET websites=? WHERE id=?').run(JSON.stringify(newWebsites), this.userId);
        this._websites = newWebsites;
    }

    public verifyPassword(password: string) : boolean {
        return bcrypt.compareSync(password, this._passwordHash);
    }

    public static getUserById(userId: number) : User | null {
        const row = <any>database.db.prepare('SELECT * FROM users WHERE id=?').get(userId);
        if(!row)
            return null;
        return new User(row.id, row.email, row.password_hash, row.flags, row['2fa_secret'], row.websites);
    }

    public static getUserByEmail(email: string) : User | null {
        const row = <any>database.db.prepare('SELECT * FROM users WHERE email=?').get(email);
        if(!row)
            return null;
        return new User(row.id, row.email, row.password_hash, row.flags, row['2fa_secret'], row.websites);
    }

    public static createUser(email: string, password: string, flags: UserFlags = <UserFlags>0) : User {
        const row = database.db.prepare('INSERT INTO users (email, password_hash, flags) VALUES (?, ?, ?)').run(email, bcrypt.hashSync(password, 12), <number>flags);
        return this.getUserById(<number>row.lastInsertRowid)!;
    }
}