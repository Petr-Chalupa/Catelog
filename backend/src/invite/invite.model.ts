export interface Invite {
    id: string;
    listId: string;
    inviter: string;
    invitee: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}
