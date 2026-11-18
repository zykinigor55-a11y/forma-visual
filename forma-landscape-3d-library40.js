/* FORMA 3D — curated catalogue of 40 genuinely distinct licensed PBR glTF models.
 * Every object maps 1:1 to a different Poly Haven CC0 source with downloaded textures.
 * Widths are initial approximate scene footprints in metres; adjust in Inspector.
 * The editor loads binaries on demand, never 40 GLBs into RAM at once.
 */
export const REAL_3D_CATEGORIES=Object.freeze({
 plants:'Растения и цветы',nature:'Камни и природа',furniture:'Уличная мебель',
 structures:'Малые формы',garden:'Сад и оборудование',lighting:'Уличные фонари'
});
export const REAL_3D_OBJECTS=Object.freeze([
  {
    "id": "pine",
    "source": "pine_sapling_small",
    "name": "Сосна молодая · PBR",
    "group": "plants",
    "width": 2.5,
    "license": "CC0-1.0"
  },
  {
    "id": "spruce",
    "source": "fir_sapling",
    "name": "Ель молодая · PBR",
    "group": "plants",
    "width": 2.3,
    "license": "CC0-1.0"
  },
  {
    "id": "fern",
    "source": "fern_02",
    "name": "Папоротник лесной",
    "group": "plants",
    "width": 1,
    "license": "CC0-1.0"
  },
  {
    "id": "wild-shrub",
    "source": "shrub_01",
    "name": "Кустарник декоративный · 01",
    "group": "plants",
    "width": 1.8,
    "license": "CC0-1.0"
  },
  {
    "id": "periwinkle",
    "source": "periwinkle_plant",
    "name": "Барвинок почвопокровный",
    "group": "plants",
    "width": 0.9,
    "license": "CC0-1.0"
  },
  {
    "id": "granite-boulder",
    "source": "boulder_01",
    "name": "Валун гранитный",
    "group": "nature",
    "width": 1.6,
    "license": "CC0-1.0"
  },
  {
    "id": "outdoor-dining",
    "source": "outdoor_table_chair_set_01",
    "name": "Стол со стульями · садовый",
    "group": "furniture",
    "width": 3,
    "license": "CC0-1.0"
  },
  {
    "id": "picnic-table",
    "source": "wooden_picnic_table",
    "name": "Стол пикниковый со скамьями",
    "group": "furniture",
    "width": 2.7,
    "license": "CC0-1.0"
  },
  {
    "id": "shrub-02",
    "source": "shrub_02",
    "name": "Кустарник декоративный · 02",
    "group": "plants",
    "width": 1.6,
    "license": "CC0-1.0"
  },
  {
    "id": "shrub-03",
    "source": "shrub_03",
    "name": "Кустарник декоративный · 03",
    "group": "plants",
    "width": 1.5,
    "license": "CC0-1.0"
  },
  {
    "id": "shrub-04",
    "source": "shrub_04",
    "name": "Кустарник декоративный · 04",
    "group": "plants",
    "width": 1.5,
    "license": "CC0-1.0"
  },
  {
    "id": "nettle",
    "source": "nettle_plant",
    "name": "Крапива · естественный массив",
    "group": "plants",
    "width": 0.9,
    "license": "CC0-1.0"
  },
  {
    "id": "dandelion",
    "source": "dandelion_01",
    "name": "Одуванчики · луговые",
    "group": "plants",
    "width": 0.7,
    "license": "CC0-1.0"
  },
  {
    "id": "empodium",
    "source": "flower_empodium",
    "name": "Цветок эмподиум",
    "group": "plants",
    "width": 0.8,
    "license": "CC0-1.0"
  },
  {
    "id": "gazania",
    "source": "flower_gazania",
    "name": "Газания · цветущий куст",
    "group": "plants",
    "width": 0.9,
    "license": "CC0-1.0"
  },
  {
    "id": "ursinia",
    "source": "flower_ursinia",
    "name": "Урсиния · цветущий куст",
    "group": "plants",
    "width": 0.8,
    "license": "CC0-1.0"
  },
  {
    "id": "weed-plant",
    "source": "weed_plant_02",
    "name": "Травянистое растение",
    "group": "plants",
    "width": 0.9,
    "license": "CC0-1.0"
  },
  {
    "id": "calathea",
    "source": "calathea_orbifolia_01",
    "name": "Калатея · крупная листва",
    "group": "plants",
    "width": 1,
    "license": "CC0-1.0"
  },
  {
    "id": "anthurium",
    "source": "anthurium_botany_01",
    "name": "Антуриум · декоративная листва",
    "group": "plants",
    "width": 1,
    "license": "CC0-1.0"
  },
  {
    "id": "rock-grey",
    "source": "rock_07",
    "name": "Валун серый природный",
    "group": "nature",
    "width": 1.4,
    "license": "CC0-1.0"
  },
  {
    "id": "rock-rough",
    "source": "rock_09",
    "name": "Камень рваный природный",
    "group": "nature",
    "width": 1.4,
    "license": "CC0-1.0"
  },
  {
    "id": "rock-moss",
    "source": "rock_moss_set_01",
    "name": "Камни со мхом · группа",
    "group": "nature",
    "width": 1.9,
    "license": "CC0-1.0"
  },
  {
    "id": "tree-stump",
    "source": "tree_stump_01",
    "name": "Пень природный",
    "group": "nature",
    "width": 0.95,
    "license": "CC0-1.0"
  },
  {
    "id": "garden-bench",
    "source": "painted_wooden_bench",
    "name": "Скамья деревянная",
    "group": "furniture",
    "width": 1.9,
    "license": "CC0-1.0"
  },
  {
    "id": "street-bench",
    "source": "modular_street_seating",
    "name": "Скамья современная",
    "group": "furniture",
    "width": 2.4,
    "license": "CC0-1.0"
  },
  {
    "id": "round-garden-table",
    "source": "round_wooden_table_01",
    "name": "Стол круглый деревянный",
    "group": "furniture",
    "width": 1.2,
    "license": "CC0-1.0"
  },
  {
    "id": "garden-stool",
    "source": "folding_wooden_stool",
    "name": "Табурет складной",
    "group": "furniture",
    "width": 0.6,
    "license": "CC0-1.0"
  },
  {
    "id": "gallinera-table",
    "source": "gallinera_table",
    "name": "Стол обеденный садовый",
    "group": "furniture",
    "width": 1.6,
    "license": "CC0-1.0"
  },
  {
    "id": "gallinera-chair",
    "source": "gallinera_chair",
    "name": "Стул садовый",
    "group": "furniture",
    "width": 0.75,
    "license": "CC0-1.0"
  },
  {
    "id": "fire-pit",
    "source": "stone_fire_pit",
    "name": "Костровая чаша из камня",
    "group": "structures",
    "width": 1.6,
    "license": "CC0-1.0"
  },
  {
    "id": "planter-small",
    "source": "planter_box_01",
    "name": "Кашпо деревянное · 01",
    "group": "structures",
    "width": 1.1,
    "license": "CC0-1.0"
  },
  {
    "id": "planter-medium",
    "source": "planter_box_02",
    "name": "Кашпо деревянное · 02",
    "group": "structures",
    "width": 1.2,
    "license": "CC0-1.0"
  },
  {
    "id": "planter-large",
    "source": "planter_box_03",
    "name": "Кашпо деревянное · 03",
    "group": "structures",
    "width": 1.4,
    "license": "CC0-1.0"
  },
  {
    "id": "sprinkler",
    "source": "garden_sprinkler_01",
    "name": "Дождеватель газонный",
    "group": "garden",
    "width": 0.6,
    "license": "CC0-1.0"
  },
  {
    "id": "watering-can",
    "source": "watering_can_metal_01",
    "name": "Лейка металлическая",
    "group": "garden",
    "width": 0.65,
    "license": "CC0-1.0"
  },
  {
    "id": "garden-hose",
    "source": "garden_hose_wall_mounted_01",
    "name": "Катушка садового шланга",
    "group": "garden",
    "width": 0.85,
    "license": "CC0-1.0"
  },
  {
    "id": "wicker-basket",
    "source": "wicker_basket_01",
    "name": "Корзина плетёная",
    "group": "garden",
    "width": 0.62,
    "license": "CC0-1.0"
  },
  {
    "id": "compost-bags",
    "source": "compost_bags",
    "name": "Мешки с грунтом",
    "group": "garden",
    "width": 1.4,
    "license": "CC0-1.0"
  },
  {
    "id": "street-lamp-one",
    "source": "street_lamp_01",
    "name": "Фонарь уличный · 01",
    "group": "lighting",
    "width": 0.75,
    "license": "CC0-1.0"
  },
  {
    "id": "street-lamp-two",
    "source": "street_lamp_02",
    "name": "Фонарь уличный · 02",
    "group": "lighting",
    "width": 0.75,
    "license": "CC0-1.0"
  }
].map(Object.freeze));
export const realModelById=id=>REAL_3D_OBJECTS.find(o=>o.id===id)||null;
export const REAL_3D_TOTAL=REAL_3D_OBJECTS.length;
