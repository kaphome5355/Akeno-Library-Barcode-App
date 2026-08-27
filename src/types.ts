export type BookSlot = string | null;

export type Student = {
  id: string;
  studentNumber: string;
  books: BookSlot[]; // length 3
  confirmed: boolean;
  createdAt: number;
};
