import { MODULE_TITLE, MODULE_TITLE_SHORT } from "./scripts/const.mjs";
import { patchAbilityChecks } from "./scripts/patches/ability-check-patches.mjs";
import { patchItemBaseRoll } from "./scripts/patches/item-base-roll-patch.mjs";
import { patchItemRollDamage } from "./scripts/patches/item-damage-patch.mjs";
import { patchItemPrepareData, patchItemSheetGetData } from "./scripts/patches/initialize-formula-groups.mjs";
import { patchItemDisplayCard } from "./scripts/patches/item-display-card-patch.mjs";
import { registerSettings } from "./scripts/settings.mjs";

Hooks.on("setup", () => {
    console.log(`${MODULE_TITLE_SHORT} | Initializing ${MODULE_TITLE}`);
    registerSettings();
    patchAbilityChecks();
    patchItemBaseRoll();
    patchItemDisplayCard();
    patchItemRollDamage();
    patchItemPrepareData();
    patchItemSheetGetData();
});
