export type Election = {
  id: string;
  name: string;
  description: string;
  organizer: string;
  voters: number[];
  candidates: number[];
  status: string;
  startDate: Date;
  endDate: Date;
  date: string;
  imageUrl?: string;
};

export type NewElectionData = Omit<Election, 'id'>;

export type SavedElectionData = Election;

export type ElectionCard = Election;
