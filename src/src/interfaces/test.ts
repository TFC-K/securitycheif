import database from "../database";
import { IArtifact, TestFlags } from "./interfaces";
import User from "./user";
import crypto from 'crypto';

export default class Test {
    public readonly testId: string = <any>{};
    
    private _requestee: number = 0;
    private _createdAt: number = 0;
    private _updatedAt: number = 0;
    private _flags: TestFlags = 0;
    private _website: string = <any>{};
    private _artifacts: IArtifact[] = [];

    private constructor(id: string, requestee: number, createdAt: number, updatedAt: number, flags: TestFlags, artifacts: IArtifact[], website: string) {
        this.testId = id;
        this._requestee = requestee;
        this._createdAt = createdAt;
        this._updatedAt = updatedAt;
        this._flags = flags;
        this._website = website;
        this._artifacts = artifacts;
    }

    public get requestee() : User {
        return User.getUserById(this._requestee)!;
    }

    public get flags() : TestFlags {
        return this._flags;
    }

    public get artifacts() : IArtifact[] {
        return this._artifacts;
    }

    public set artifacts(artifacts: IArtifact[]) {
        database.db.prepare('UPDATE tests SET artifacts=? WHERE id=?').run(JSON.stringify(artifacts), this.testId);
        this._artifacts = artifacts;
    }

    public set flags(newFlags: TestFlags) {
        database.db.prepare('UPDATE tests SET flags=? WHERE id=?').run(<number>newFlags, this.testId);
        this._flags = newFlags;
    }

    public static getTestById(testId: string) : Test | null {
        const row = <any>database.db.prepare('SELECT * FROM tests WHERE id=?').get(testId);
        if(!row)
            return null;
        return new Test(row.id, row.requestee, row.created_at, row.updated_at, row.flags, JSON.parse(row.artifacts), row.website);
    }

    public static createTest(requestee: User, website: string) : Test {
        const id = crypto.randomBytes(16).toString('hex');
        database.db.prepare('INSERT INTO tests (id, requestee, created_at, updated_at, website) VALUES (?, ?, ?, ? ,?)').run(id, requestee.userId, Date.now(), Date.now(), website);
        return this.getTestById(id)!;
    }
}