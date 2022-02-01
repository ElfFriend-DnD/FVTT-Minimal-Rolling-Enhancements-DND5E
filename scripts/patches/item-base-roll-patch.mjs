import { libWrapper } from "../../lib/libWrapper/shim.js";
import { MODULE_NAME } from "../const.mjs";
import { SETTING_NAMES } from "../settings.mjs";
import { initializeFormulaGroups } from "./initialize-formula-groups.mjs";

/**
 * When I roll an Item, also roll the item check/attack and damage if the options say to do so
 */
export function patchItemBaseRoll() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.documentClass.prototype.roll", async function patchedRoll(wrapped, config, ...args) {
        let currentGlobalEvent = event; // black magic global event the browser keeps track of

        await initializeFormulaGroups(this);

        const autoRollCheckSetting = game.settings.get(MODULE_NAME, SETTING_NAMES.AUTO_CHECK);
        const autoRollDamageSetting = game.settings.get(MODULE_NAME, SETTING_NAMES.AUTO_DMG);
        const autoRollRolltableSetting = game.settings.get(MODULE_NAME, SETTING_NAMES.AUTO_ROLLTABLE);
        const autoRollCheckWithOverride = this.getFlag(MODULE_NAME, "autoRollAttack") ?? autoRollCheckSetting;
        const autoRollDamageWithOverride = this.getFlag(MODULE_NAME, "autoRollDamage") ?? autoRollDamageSetting;
        const autoRollOther = this.getFlag(MODULE_NAME, "autoRollOther");
        const autoRollRolltableWithOverride = this.getFlag(MODULE_NAME, "autoRollRolltable") ?? autoRollRolltableSetting;

        // some rolls only create their chat card after other dialogs have been interacted with
        // we need to capture the current global event on intial use to pass in to later rolls.
        const capturedGlobalEvent = foundry.utils.deepClone(currentGlobalEvent);

        // Call the original Item5e#roll and get the resulting message data
        const chatMessage = await wrapped(config, ...args);

        // Short circuit if auto roll is off for this user/item
        // OR if User quit out of the dialog workflow early (or some other failure)
        if ((!autoRollCheckWithOverride && !autoRollDamageWithOverride && !autoRollOther && !autoRollRolltableWithOverride) || !chatMessage) {
            return chatMessage;
        }

        // Make a roll if auto rolls is on
        let checkRoll;
        if (autoRollCheckWithOverride) {
            if (this.hasAttack) {
                checkRoll = await this.rollAttack({ event: capturedGlobalEvent });
            } else if (this.type === "tool") {
                checkRoll = await this.rollToolCheck({ event: capturedGlobalEvent });
            }
        }

        let chatMessageData = chatMessage;
        if (chatMessage instanceof ChatMessage) {
            chatMessageData = chatMessage.data;
        }

        // temporary until this can be added to core
        const spellLevel = chatMessageData?.flags?.[MODULE_NAME]?.['spellLevel'] ?? this.data.data?.level;
        const options = { spellLevel };
        if (Number.isNumeric(config?.spellLevel)) options.spellLevel = config.spellLevel;

        if (this.hasDamage && autoRollDamageWithOverride) {
            if (checkRoll) {
                options.critical = checkRoll.dice[0].results[0].result >= checkRoll.terms[0].options.critical;
            }
            await this.rollDamage(options);
        }

        if (this.data.data.formula?.length && autoRollOther) {
            await this.rollFormula(options);
        }

        const tableUuid = this.data.flags?.['items-with-rolltables-5e']?.['rollable-table-uuid'];

        if (game.modules.get('items-with-rolltables-5e')?.active && !!tableUuid && autoRollRolltableWithOverride) {
            const document = await fromUuid(tableUuid);
            if (!!document) document.draw();
        }

        return chatMessage;
    }, "WRAPPER");
}
