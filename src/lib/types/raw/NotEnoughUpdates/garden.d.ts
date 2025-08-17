export type NEUGardenRaw = {
  garden_exp: number[];
  crop_milestones: Record<string, number[]>;
  visitors: Record<string, string>;
  plots: Record<string, NEUGardenRawPlot>;
  plot_costs: Record<string, NEUGardenRawPlotCost[]>;
  barn: Record<string, NEUGardenRawBarnSkin>;
  crop_upgrades: number[];
  composter_upgrades: NEUGardenRawComposterUpgrades;
};

export type NEUGardenRawPlot = {
  name: string;
  x: number;
  y: number;
};

export type NEUGardenRawPlotCost = {
  item: string;
  amount: number;
};

export type NEUGardenRawBarnSkin = {
  name: string;
  item: string;
};

export type NEUGardenRawComposterUpgrades = {
  speed: Record<string, NEUGardenRawComposterUpgrade>;
  multi_drop: Record<string, NEUGardenRawComposterUpgrade>;
  fuel_cap: Record<string, NEUGardenRawComposterUpgrade>;
  organic_matter_cap: Record<string, NEUGardenRawComposterUpgrade>;
  cost_reduction: Record<string, NEUGardenRawComposterUpgrade>;
};

export type NEUGardenRawComposterUpgrade = {
  upgrade: string;
  items: Record<string, number>;
  copper: number;
};
