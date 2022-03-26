/**
 * Collection of groups
 */
export interface GroupCollection {
  [key: string]: GroupInformation; // Key is the group id
}
/**
 * information about a group
 */
export interface GroupInformation {
  id?: string; // Group ID
  name: string; // Group name
  member?: boolean; // Whether the user is a member of the group for the moment this is always set to true since there are no public groups
  members?: GroupMember[]; // Members of the group
}
/**
 * Member of a group
 */
export interface GroupMember {
  id: string; // User Agent ID
  name: string; // User name
}

export class GroupMember implements GroupMember {
  constructor(public id: string, public name: string) {}
}
