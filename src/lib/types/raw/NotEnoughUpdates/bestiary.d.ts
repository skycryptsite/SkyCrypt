export type NEUBestiaryRaw = {
  brackets: Record<string, number[]>;
  [key: string]: NEUBestiaryRawIslandData;
};

export type NEUBestiaryRawIslandData = {
  name: string;
  icon: {
    skullOwner: string;
    texture: string;
    item: string;
  };
  mobs: Mob[];
  hasSubcategories: boolean;
  [key: string]: NEUBestiaryRawMob[];
};

type NEUBestiaryRawMob = {
  name: string;
  item?: string;
  skullOwner?: string;
  texture?: string;
  cap: number;
  mobs: string[];
  bracket: number;
};
