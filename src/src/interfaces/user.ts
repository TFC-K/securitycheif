import database from '../database';
import { UserFlags } from './interfaces';
import bcrypt from 'bcrypt';
import * as twoFactor from 'node-2fa';
import crypto from 'crypto';

export default class User {
    public readonly userId: number = 0;

    private _passwordHash: string = <any>{};
    private _email: string = <any>{}; 
    private _twoFactorSecret = <any>{};
    private _websites = <string[]>{};
    private _flags: UserFlags = <UserFlags>0;
    private _sessionToken: string | null = null;

    private constructor(id: number, email: string, passwordHash: string, sessionToken: string | null, flags: number, twoFactorSecret: string | null, websites: string) {
        this.userId = id;
        this._email = email;
        this._flags = <UserFlags>flags;
        this._twoFactorSecret = twoFactorSecret;
        this._websites = JSON.parse(websites);
        this._passwordHash = passwordHash;
        this._sessionToken = sessionToken;
    }

    public get has2fa() {
        return this._twoFactorSecret !== null;
    }

    public get flags() {
        return this._flags;
    }

    public get email() {
        return this._email;
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

    public rollSessionToken() : string {
        //128 bits
        this._sessionToken = crypto.randomBytes(1024 / 8).toString('hex');
        database.db.prepare('UPDATE users SET session_token=? WHERE id=?').run(this._sessionToken, this.userId);
        return this._sessionToken;
    }

    public verifyPassword(password: string) : boolean {
        return bcrypt.compareSync(password, this._passwordHash);
    }

    public hasFlags(flagMask: UserFlags) : boolean {
        return (this._flags & flagMask) === flagMask;
    }

    public verifyTwoFactorCode(code: string) : boolean {
        if(!this._twoFactorSecret)
            return false;
        const verifyResult = twoFactor.verifyToken(this._twoFactorSecret, code);
        if(!verifyResult)
            return false;

        return verifyResult?.delta === 0;
    }

    public static getUserById(userId: number) : User | null {
        const row = <any>database.db.prepare('SELECT * FROM users WHERE id=?').get(userId);
        if(!row)
            return null;
        return new User(row.id, row.email, row.password_hash, row.session_token, row.flags, row['2fa_secret'], row.websites);
    }

    public static getUserByToken(token: string) : User | null {
        if(!token)
            return null;

        const row = <any>database.db.prepare('SELECT * FROM users WHERE session_token=?').get(token);
        if(!row)
            return null;
        return new User(row.id, row.email, row.password_hash, row.session_token, row.flags, row['2fa_secret'], row.websites);
    }

    public static getUserByEmail(email: string) : User | null {
        const row = <any>database.db.prepare('SELECT * FROM users WHERE LOWER(email)=LOWER(?)').get(email);
        if(!row)
            return null;
        return new User(row.id, row.email, row.password_hash, row.session_token, row.flags, row['2fa_secret'], row.websites);
    }

    public static createUser(email: string, password: string, flags: UserFlags = <UserFlags>0) : User {
        const row = database.db.prepare('INSERT INTO users (email, password_hash, flags) VALUES (?, ?, ?)').run(email, bcrypt.hashSync(password, 12), <number>flags);
        return this.getUserById(<number>row.lastInsertRowid)!;
    }
}