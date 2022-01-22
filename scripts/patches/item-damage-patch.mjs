import { libWrapper } from "../../lib/libWrapper/shim.js";
import { MODULE_NAME } from "../const.mjs";
import { getSettingLocalOrDefault, SETTING_NAMES } from "../settings.mjs";
import { combineRolls } from "../utils.mjs";

// intentionally does not listen to global modifiers so automatic damage rolls do not inherit Advantage as Critical
export function patchItemRollDamage() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.documentClass.prototype.rollDamage", async function patchedRollDamage(wrapped, config, ...rest) {
        // Check whether this item is capable of rolling damage
        if (!this.data.data.damage?.parts) throw new Error("You cannot roll damage for this item.");

        // Grab related settings
        let rollDialogBehaviorSetting = getSettingLocalOrDefault(SETTING_NAMES.ROLL_DLG_BHVR);
        let showDamageDialogModifier = getSettingLocalOrDefault(SETTING_NAMES.SHOW_ROLL_DLG_MOD);
        let advModifier = getSettingLocalOrDefault(SETTING_NAMES.ADV_MOD);

        // Initialize incoming parameters
        if (!config) {
            config = {}
        };

        let { formulaGroup = 0, event = {}, critical = event[advModifier], options = {} } = config;

        // Set up initial inner roll parameters
        const actionTypeDamageType = this.data.data.actionType === "heal"
            ? game.i18n.localize("DND5E.Healing")
            : game.i18n.localize("DND5E.DamageRoll");
        let title = `${this.name} - ${actionTypeDamageType}`;
        let rollMode = options.rollMode ?? game.settings.get("core", "rollMode");
        let bonus = null;

        const shouldShowDialog = !critical && (rollDialogBehaviorSetting === "skip"
            ? event[showDamageDialogModifier]
            : !event[showDamageDialogModifier]);
        // Show a custom dialog that applies to all damage parts
        if (shouldShowDialog) {
            const dialogOptions = mergeObject(
                options.dialogOptions || {},
                {
                    top: event?.clientY ? event.clientY - 80 : null,
                    left: event?.clientX ? window.innerWidth - 710 : null,
                }
            );
            const dialogData = await _damageDialog({ title, rollMode, dialogOptions });

            if (!dialogData) return null;

            critical = dialogData?.critical ?? critical;
            rollMode = dialogData?.rollMode ?? rollMode;
            bonus = dialogData?.bonus ?? bonus;
        }

        // Skip core dnd5e dialog
        if (!config.options) config.options = {};
        config.options.fastForward = true;
        config.critical = critical;

        // Prepare chosen formula group
        const groups = this.getFlag(MODULE_NAME, "formulaGroups");
        const group = groups[formulaGroup];
        if (!group) throw new Error(`Invalid formula group index provided: ${formulaGroup}`);
        if (groups.length > 1) title += ` (${group.label})`;

        // Filter item damage parts according to the chosen group
        const itemFormulae = this.data.data.damage.parts;
        const groupDamageParts = group.formulaSet.map(f => itemFormulae[f]);
        if (groupDamageParts.every(p => p === undefined)) {
            const msg = game.i18n.format(`${MODULE_NAME}.FORMULA-GROUP.GroupEmptyError`, group);
            ui.notifications.warn(msg);
            throw new Error(msg);
        }

        // Add a situational bonus if one was provided
        if (bonus) groupDamageParts.push([bonus, "bonus"]);

        // Roll the filtered group damage parts
        const partRolls = await _rollDamageParts(this.data.data.damage, groupDamageParts, wrapped, config, ...rest);

        // Prepare the chat message content
        const renderedContent = await _renderCombinedDamageRollContent(this, partRolls);

        const messageData = await _createCombinedDamageMessageData(this, renderedContent, title, partRolls.map(p => p.roll), critical, rollMode, options);

        if (options.chatMessage ?? true) {
            const msg = new ChatMessage(messageData);
            await ChatMessage.create(msg.data);
        }

        // Return the array of Roll objects
        return combineRolls(...partRolls.map(p => p.roll));
    }, "MIXED");
}

/**
 * @returns {Promise<{ critical: Boolean, bonus: Number, rollMode: String }>}
 * @private
 */
async function _damageDialog({ title, rollMode, dialogOptions } = {}) {
    const template = "systems/dnd5e/templates/chat/roll-dialog.html";
    const dialogData = {
        formula: "",
        rollMode: rollMode,
        rollModes: CONFIG.Dice.rollModes,
    };
    const content = $(await renderTemplate(template, dialogData));

    content.find("[name=formula]").closest(".form-group").remove();

    return new Promise(resolve => {
        new Dialog({
            title,
            content: content.prop("outerHTML"),
            buttons: {
                critical: {
                    label: game.i18n.localize("DND5E.CriticalHit"),
                    callback: html => resolve({ critical: true, ..._parseDamageDialog(html[0].querySelector("form")) })
                },
                normal: {
                    label: game.i18n.localize("DND5E.Normal"),
                    callback: html => resolve({ critical: false, ..._parseDamageDialog(html[0].querySelector("form")) })
                },
            },
            default: "normal",
            close: () => resolve(null)
        }, dialogOptions).render(true);
    });
}

function _parseDamageDialog(form) {
    return form ? {
        bonus: form.bonus.value,
        rollMode: form.rollMode.value,
    } : {};
}

async function _rollDamageParts(itemDamage, groupDamageParts, innerRollDamage, { critical, event, spellLevel, versatile, options }, ...rest) {
    const partRolls = [];

    const originalItemDamageParts = foundry.utils.deepClone(itemDamage.parts);

    // Roll each of the item's damage parts separately.
    for (let [formula, type] of groupDamageParts.filter(item => !!item)) {
        const partOptions = foundry.utils.deepClone(options);
        partOptions.chatMessage = false;

        // Override the item's damage so that the original roll damage function only rolls one "part" at a time.
        itemDamage.parts = [[formula, type]];
        /** @type Roll */
        const roll = await innerRollDamage({
            critical,
            event,
            spellLevel,
            versatile,
            options: partOptions,
        }, ...rest);
        if (!roll) continue;
        const flavor = type === "bonus"
            ? game.i18n.localize("DND5E.RollSituationalBonus").slice(0, -1)
            : CONFIG.DND5E.damageTypes[type] ?? CONFIG.DND5E.healingTypes[type] ?? game.i18n.localize("DND5E.Damage");
        partRolls.push({ roll, flavor });
    }

    itemDamage.parts = originalItemDamageParts;
    return partRolls;
}

async function _renderCombinedDamageRollContent(item, rolls) {
    const renderedRolls = [];

    // Render all each of the rolls to html
    for (let part of rolls) {
        const rendered = $(await part.roll.render());
        const formulaElement = rendered.find(".dice-total");
        formulaElement.attr("data-damage-type", part.flavor);
        renderedRolls.push(rendered);
    }

    // Assemble them under one container div
    const container = $(`<div class="dnd5e chat-card item-card mre-damage-card">`);
    container.append(`<div class="card-content">`);
    const damageSection = $(`<div class="card-roll formula-group">`);
    damageSection.append(renderedRolls);
    damageSection.find(".dice-roll:not(:last-child)").after("<hr />");

    // Append the total result if the appropriate setting is enabled
    const showTotal = game.settings.get(MODULE_NAME, SETTING_NAMES.SHOW_TOTAL_DMG);
    if (showTotal && renderedRolls.length > 1) {
        const rollTotal = rolls.reduce((acc, next) => acc + next.roll.total, 0);
        const totalLabel = game.i18n.localize(`${MODULE_NAME}.OTHER.TotalDamage`);
        damageSection.append("<hr />");
        damageSection.append(`<h4 class="card-total dice-total" data-damage-type="${totalLabel}">${rollTotal}</h4>`);
    }

    container.append(damageSection);

    return container.prop("outerHTML");
}

async function _createCombinedDamageMessageData(item, content, flavor, rolls, critical, rollMode, options) {
    // This decoy roll is used to convince foundry that the message has ROLL type
    const combinedRoll = combineRolls(...rolls);

    // Set up data for the final message to be sent
    const messageData = {
        user: game.user.id,
        content,
        flavor,
        roll: combinedRoll,
        speaker: ChatMessage.getSpeaker({ actor: item.actor }),
        sound: CONFIG.sounds.dice,
        type: foundry.CONST.CHAT_MESSAGE_TYPES.ROLL,
        flags: {
            ["dnd5e.roll"]: { type: "damage", itemId: item.id },
            ["mre-dnd5e.rolls"]: rolls.map(r => foundry.utils.deepClone(r)),
        }
    };

    if (critical) {
        messageData.flavor += ` (${game.i18n.localize("DND5E.Critical")})`;
        messageData.flags["dnd5e.roll"].critical = true;
    }

    ChatMessage.applyRollMode(messageData, rollMode);

    // Merge with data passed into the function call
    foundry.utils.mergeObject(messageData, options, { insertKeys: false });
    foundry.utils.mergeObject(messageData, options.messageData);

    return messageData;
}
