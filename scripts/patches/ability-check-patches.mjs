import { libWrapper } from "../../lib/libWrapper/shim.js";
import { MODULE_NAME } from "../const.mjs";
import { getSettingLocalOrDefault, SETTING_NAMES } from "../settings.mjs";

const d20RollsToPatch = [
    { path: "CONFIG.Item.documentClass.prototype.rollAttack", optionsIndex: 0 },
    { path: "CONFIG.Item.documentClass.prototype.rollToolCheck", optionsIndex: 0 },
    { path: "CONFIG.Actor.documentClass.prototype.rollSkill", optionsIndex: 1 },
    { path: "CONFIG.Actor.documentClass.prototype.rollAbilityTest", optionsIndex: 1 },
    { path: "CONFIG.Actor.documentClass.prototype.rollAbilitySave", optionsIndex: 1 },
    { path: "CONFIG.Actor.documentClass.prototype.rollDeathSave", optionsIndex: 0 },
]

export function patchAbilityChecks() {
    for (let method of d20RollsToPatch) {
        libWrapper.register(MODULE_NAME, method.path, generateD20RollPatch(method.optionsIndex), "WRAPPER");
    }
}

// Patches a d20 roll to use the modifier hotkeys set in the module settings
function generateD20RollPatch(optionsIndex) {
    return function(wrapper, ...args) {
        let currentGlobalEvent = event; // black magic global event the browser keeps track of
        let options = args[optionsIndex];
        if (!options) args[optionsIndex] = options = {};

        let dialogBehaviorSetting = getSettingLocalOrDefault(SETTING_NAMES.ROLL_DLG_BHVR);
        let noFastForwardModifier = getSettingLocalOrDefault(SETTING_NAMES.SHOW_ROLL_DLG_MOD);
        let advModifier = getSettingLocalOrDefault(SETTING_NAMES.ADV_MOD);
        let disAdvModifier = getSettingLocalOrDefault(SETTING_NAMES.DISADV_MOD);

        const evt = options.event ?? foundry.utils.deepClone(currentGlobalEvent);
        delete options.event;

        const optionsOverride = {
            advantage: evt[advModifier],
            disadvantage: evt[disAdvModifier],
        }

        // The wrapped call will set the position of the dialog using dialogOptions, however if clientX and clientY are not defined,
        // It will place it in a weird location. For this reason, when clientX and Y are not defined, we override the dialog to be at
        // null, null, which will place it in the center of the window.
        if (!evt?.clientX || !evt?.clientY) {
            optionsOverride.dialogOptions = { top: null, left: null };
        }
        foundry.utils.mergeObject(options, optionsOverride, { overwrite: false });

        let fastForward = evt[noFastForwardModifier];
        if (dialogBehaviorSetting === "skip") fastForward = !fastForward;

        options.fastForward = options.advantage || options.disadvantage || fastForward;

        return wrapper(...args);
    }
}
