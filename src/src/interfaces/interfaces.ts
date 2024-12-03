export enum UserFlags {
    None = 0,

    Verified = 1<<0,
    Administrator = 1<<1,
    SuperAdministrator = 1<<2
};

export enum TestFlags {
    None = 0,

    Submitted = 1<<0,
    InProgress = 1<<1,
    Complete = 1<<2,
};

export enum ArtifactType {
    Markdown,
    Video,
    Image
};

export interface IArtifact {
    type: ArtifactType;
    title: string;
    content: any;
};