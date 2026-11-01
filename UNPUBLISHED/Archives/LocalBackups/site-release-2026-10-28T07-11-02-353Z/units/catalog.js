import {STATS} from '../stats-data.js';
import {validateUnitDefinitions,freezeDefinitions} from './schema.js';
import fenris from './characters/fenris/unit.js';
import harl from './npcs/village/harl/unit.js';
import edra from './npcs/village/edra/unit.js';
import woodcutter from './npcs/village/woodcutter/unit.js';
import farmer from './npcs/village/farmer/unit.js';
import resident from './npcs/village/resident/unit.js';
import washer from './npcs/village/washer/unit.js';
import vendor from './npcs/village/vendor/unit.js';
import innkeeper from './npcs/village/innkeeper/unit.js';
import trader from './npcs/village/trader/unit.js';
import blacksmith from './npcs/village/blacksmith/unit.js';
import herbalist from './npcs/village/herbalist/unit.js';
import deer from './critters/deer/unit.js';
import wolf from './critters/wolf/unit.js';
import hare from './critters/hare/unit.js';
import owl from './critters/owl/unit.js';

// Register authored units explicitly: templates and draft creatures never spawn by accident.
export const UNIT_DEFINITIONS=freezeDefinitions(validateUnitDefinitions(Object.fromEntries([fenris,harl,edra,woodcutter,farmer,resident,washer,vendor,innkeeper,trader,blacksmith,herbalist,deer,wolf,hare,owl].map(unit=>[unit.id,unit])),STATS.actors));
export const VILLAGE_UNITS=Object.values(UNIT_DEFINITIONS).filter(unit=>unit.behaviour.village);
