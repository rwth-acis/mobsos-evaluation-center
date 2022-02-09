export interface GroupInformation {
  id?: string;
  name: string;
  member?: boolean;
  members?: GroupMember[];
}

export interface GroupCollection {
  [key: string]: GroupInformation;
}

export interface GroupMember {
  id: string;
  name: string;
}

export class GroupMember implements GroupMember {
  constructor(public id: string, public name: string) {}
}
