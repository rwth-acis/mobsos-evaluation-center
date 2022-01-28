export interface GroupInformation {
  id?: string;
  name: string;
  member?: boolean;
}

export interface GroupCollection {
  [key: string]: GroupInformation;
}
