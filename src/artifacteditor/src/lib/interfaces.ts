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