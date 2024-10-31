export function verifyEmailRegex(emailStr: string) : boolean {
    return emailStr.match('^\\S+@\\S+\\.\\S+$') !== null;
}