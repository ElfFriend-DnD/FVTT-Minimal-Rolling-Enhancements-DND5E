import { libWrapper } from "../../lib/libWrapper/shim.js";
import { MODULE_NAME } from "../const.mjs";
import { SETTING_NAMES } from "../settings.mjs";

// When I create an Item chat card, replace the damage buttons with our custom ones.
export function patchItemDisplayCard() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.documentClass.prototype.displayCard", async function patchedDisplayCard(wrapped, options, ...rest) {
        // If the caller above us set createMessage to false, we should not create a chat card and instead just return our message data.
        const shouldCreateMessage = options?.createMessage ?? true;

        // we create the message ourselves, don't want the original method to create
        const wrappedOptions = {...options, createMessage: false };

        // Call the original Item5e#roll and get the resulting message data
        const messageData = await wrapped(wrappedOptions, ...rest);

        // User quit out of the dialog workflow early (or some other failure)
        if (!messageData) return;

        // inject spell level as a flag on the messageData
        const spellLevel = this.data.data.level;
        messageData.flags[MODULE_NAME] = {
            ...messageData.flags[MODULE_NAME],
            spellLevel
        };

        if (this.hasDamage) _replaceDamageButtons(messageData, this);

        const result = shouldCreateMessage ? await ChatMessage.create(messageData) : messageData;

        return result;
    }, "WRAPPER");
}

/**
 * Replace stock damage buttons with our buttons for each damage group
 * Mutates input messageData
 */
function _replaceDamageButtons(messageData, item) {
    const content = $(messageData.content);
    content.find(".chat-card").addClass("mre-item-card");

    // Remove existing damage and versatile buttons
    content.find("[data-action=damage],[data-action=versatile]").remove();

    // Create formula group buttons
    const formulaGroups = item.getFlag(MODULE_NAME, "formulaGroups");
    const damageText = game.i18n.localize("DND5E.Damage");
    const healingText = game.i18n.localize("DND5E.Healing");
    const damageButtons = formulaGroups.map((group, i) => {
        let buttonText = item.data.data.actionType === "heal" ? healingText : damageText;
        if (formulaGroups.length > 1) buttonText += ` (${group.label})`;
        return $(`<button data-action="formula-group" data-formula-group="${i}">${buttonText}</button>`);
    });

    // Inject formula group buttons
    const attackButton = content.find("[data-action=attack],[data-action=toolCheck]").last();
    const cardButtons = content.find(".card-buttons");
    if (attackButton.length) {
        attackButton.after(damageButtons);
        if (game.settings.get(MODULE_NAME, SETTING_NAMES.ADV_DIS_BUTTONS)) {
            attackButton.width("60%");
            attackButton.after($(`<button data-action="attack" data-mre-mode="dis" style="width: 20%">(${game.i18n.localize("DND5E.Disadvantage").substring(0,3)})</button>`));
            attackButton.after($(`<button data-action="attack" data-mre-mode="adv" style="width: 20%">(${game.i18n.localize("DND5E.Advantage").substring(0,3)})</button>`));
        }
    } else {
        cardButtons.prepend(damageButtons);
    }

    messageData.content = content.prop("outerHTML");
}
