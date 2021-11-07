import { MODULE_NAME } from "./const.mjs";

export const SETTING_NAMES = {
    AUTO_CHECK: "autoCheck",
    AUTO_DMG: "autoDamage",
    AUTO_ROLLTABLE: "autoRolltable",
    SHOW_TOTAL_DMG: "showTotalDamage",
    ROLL_DLG_BHVR: "rollDialogBehavior",
    SHOW_ROLL_DLG_MOD: "showRollDialogModifier",
    ADV_MOD: "advModifier",
    DISADV_MOD: "disAdvModifier",
}

export function registerSettings() {
    _registerAutoRollsSettings();
    _registerOtherSettings();
    _registerModifierKeySettings();
}

export function getSettingLocalOrDefault(settingKey) {
    const localKey = `${settingKey}Local`;
    const globalKey = `${settingKey}Global`;
    const value = game.settings.get(MODULE_NAME, localKey);
    const defaultValue = game.settings.settings.get(`${MODULE_NAME}.${localKey}`).default;
    return value === defaultValue ? game.settings.get(MODULE_NAME, globalKey) : value;
}

function _registerAutoRollsSettings() {
    game.settings.register(MODULE_NAME, SETTING_NAMES.AUTO_CHECK, {
        name: game.i18n.localize(`${MODULE_NAME}.SETTINGS.AutoRollChecksLabel`),
        hint: game.i18n.localize(`${MODULE_NAME}.SETTINGS.AutoRollChecksHint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });

    game.settings.register(MODULE_NAME, SETTING_NAMES.AUTO_DMG, {
        name: game.i18n.localize(`${MODULE_NAME}.SETTINGS.AutoRollDamageLabel`),
        hint: game.i18n.localize(`${MODULE_NAME}.SETTINGS.AutoRollDamageHint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });

    // This should only appear if the module is present (until this can be added to the system)
    game.settings.register(MODULE_NAME, SETTING_NAMES.AUTO_ROLLTABLE, {
        name: game.i18n.localize(`${MODULE_NAME}.SETTINGS.AutoRollRolltableLabel`),
        hint: game.i18n.localize(`${MODULE_NAME}.SETTINGS.AutoRollRolltableHint`),
        scope: "world",
        config: game.modules.get('items-with-rolltables-5e')?.active,
        type: Boolean,
        default: false,
    });
}

function _registerOtherSettings() {
    game.settings.register(MODULE_NAME, SETTING_NAMES.SHOW_TOTAL_DMG, {
        name: game.i18n.localize(`${MODULE_NAME}.SETTINGS.ShowDamageTotalLabel`),
        hint: game.i18n.localize(`${MODULE_NAME}.SETTINGS.ShowDamageTotalHint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });

    const globalEnabledChoices = {
        "skip": game.i18n.localize(`${MODULE_NAME}.SETTINGS.Skip`),
        "show": game.i18n.localize(`${MODULE_NAME}.SETTINGS.Show`),
    };

    const localEnabledChoices = {
        "default": game.i18n.localize(`${MODULE_NAME}.MODIFIERS.default`),
        ...globalEnabledChoices,
    };

    const _registerToggle = makeGlobalLocalSettingRegisterer(globalEnabledChoices, localEnabledChoices);

    const rollDialogBehaviorLabel = game.i18n.localize(`${MODULE_NAME}.SETTINGS.RollDialogBehaviorLabel`);
    const rollDialogBehaviorHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.RollDialogBehaviorHint`);

    _registerToggle(`${SETTING_NAMES.ROLL_DLG_BHVR}Global`, rollDialogBehaviorLabel, rollDialogBehaviorHint, true, "skip");
    _registerToggle(`${SETTING_NAMES.ROLL_DLG_BHVR}Local`, rollDialogBehaviorLabel, rollDialogBehaviorHint, false, "default");
}

function _registerModifierKeySettings() {
    const showRollDialogModifierLabel = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ModifierShowRollDialogLabel`);
    const showRollDialogModifierHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ModifierShowRollDialogHint`);
    const advModifierLabel = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ModifierAdvLabel`);
    const advModifierHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ModifierAdvHint`);
    const disAdvModifierLabel = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ModifierDisAdvLabel`);
    const disAdvModifierHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ModifierDisAdvHint`);

    const globalModifierChoices = {
        "altKey": game.i18n.localize(`${MODULE_NAME}.MODIFIERS.altKey`),
        "ctrlKey": game.i18n.localize(`${MODULE_NAME}.MODIFIERS.ctrlKey`),
        "metaKey": game.i18n.localize(`${MODULE_NAME}.MODIFIERS.metaKey`),
        "shiftKey": game.i18n.localize(`${MODULE_NAME}.MODIFIERS.shiftKey`),
    };

    const localModifierChoices = {
        "default": game.i18n.localize(`${MODULE_NAME}.MODIFIERS.default`),
        ...globalModifierChoices,
    }

    const _registerModifier = makeGlobalLocalSettingRegisterer(globalModifierChoices, localModifierChoices);

    _registerModifier(`${SETTING_NAMES.SHOW_ROLL_DLG_MOD}Global`, showRollDialogModifierLabel, showRollDialogModifierHint, true, "shiftKey");
    _registerModifier(`${SETTING_NAMES.ADV_MOD}Global`, advModifierLabel, advModifierHint, true, "altKey");
    _registerModifier(`${SETTING_NAMES.DISADV_MOD}Global`, disAdvModifierLabel, disAdvModifierHint, true, "ctrlKey");

    _registerModifier(`${SETTING_NAMES.SHOW_ROLL_DLG_MOD}Local`, showRollDialogModifierLabel, showRollDialogModifierHint, false, "default");
    _registerModifier(`${SETTING_NAMES.ADV_MOD}Local`, advModifierLabel, advModifierHint, false, "default");
    _registerModifier(`${SETTING_NAMES.DISADV_MOD}Local`, disAdvModifierLabel, disAdvModifierHint, false, "default");
}

function makeGlobalLocalSettingRegisterer(globalChoices, localChoices) {
    const globalDefault = game.i18n.localize(`${MODULE_NAME}.SETTINGS.GlobalDefault`);
    const localOverride = game.i18n.localize(`${MODULE_NAME}.SETTINGS.LocalOverride`);

    const globalHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.GlobalHint`);
    const localHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.LocalHint`);

    return function registerer(key, label, hint, isGlobal, defaultValue) {
        game.settings.register(MODULE_NAME, key, {
            name: makeName(label, isGlobal ? globalDefault : localOverride),
            hint: makeHint(hint, isGlobal ? globalHint : localHint),
            scope: isGlobal ? "world" : "client",
            config: true,
            type: String,
            default: defaultValue,
            choices: isGlobal ? globalChoices : localChoices,
        });
    }
}

const makeName = (name, modifier) => `${name} (${modifier})`;
const makeHint = (hint, modifier) => `${hint} ${modifier}`;
