import { libWrapper } from "../lib/libWrapper/shim.js";
import { MODULE_NAME } from "./const.js";

export function patchItemBaseRoll() {
    const modifiers = _setupModifierListeners();

    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.roll", async function (wrapped, ...args) {
        const capturedModifiers = duplicate(modifiers);

        const autoRollCheck = game.settings.get(MODULE_NAME, "autoCheck");
        const autoRollDamage = game.settings.get(MODULE_NAME, "autoDamage");

        // Ensure that the wrapped Item5e#roll method does not produce a chat message
        // because we want to modify the message prior to creating it.
        const extraOptions = { createMessage: false };
        if (args.length) {
            mergeObject(args[0], extraOptions);
        } else {
            args.push(extraOptions);
        }

        // Call the original Item5e#roll and get the resulting message data
        const messageData = await wrapped(...args);

        // User quit out of the dialog workflow early (or some other failure)
        if (!messageData) return;

        // Make a roll if auto rolls is on, and replace the appropriate button in the item card with the rendered roll results
        if (autoRollCheck) {
            let checkRoll, title;
            if (this.hasAttack) {
                checkRoll = await this.rollAttack({ event: capturedModifiers, chatMessage: false });
                title = _createWeaponTitle(this, checkRoll);
            } else if (this.type === "tool") {
                checkRoll = await this.rollToolCheck({ event: capturedModifiers, chatMessage: false  });
                title = _createToolTitle(this, checkRoll);
            }

            if (checkRoll) {
                await _replaceAbilityCheckButtonWithRollResult(messageData, checkRoll, title);

                messageData.flavor = undefined;
                messageData.roll = checkRoll;
                messageData.type = CONST.CHAT_MESSAGE_TYPES.ROLL;
            }
        }
        const result = ChatMessage.create(messageData);

        if (this.hasDamage && autoRollDamage) {
            await this.rollDamage({ event: capturedModifiers });
        }

        return result;
    }, "WRAPPER");
}

function _setupModifierListeners() {
    // A hacky way to determine if modifier keys are pressed
    const modifiers = {
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        clientX: null,
        clientY: null,
    };

    const updateModifiers = event => {
        modifiers.altKey = event.altKey;
        modifiers.ctrlKey = event.ctrlKey;
        modifiers.shiftKey = event.shiftKey;
    };

    document.addEventListener("keydown", updateModifiers);
    document.addEventListener("keyup", updateModifiers);
    document.addEventListener("mousedown", event => {
        modifiers.clientX = event.clientX;
        modifiers.clientY = event.clientY;
    });
    document.addEventListener("mouseup", () => {
        modifiers.clientX = null;
        modifiers.clientY = null;
    });
    return modifiers;
}

function _createWeaponTitle(item, roll) {
    let title = game.i18n.localize("DND5E.AttackRoll");

    const itemData = item.data.data;
    const consume = itemData.consume;
    if (consume?.type === "ammo") {
        const ammo = item.actor.items.get(consume.target);
        if (ammo) {
            title += ` [${ammo.name}]`;
        }
    }

    if (roll.terms[0].options.advantage) {
        title += ` (${game.i18n.localize("DND5E.Advantage")})`;
    } else if (roll.terms[0].options.disadvantage) {
        title += ` (${game.i18n.localize("DND5E.Disadvantage")})`;
    }

    return title;
}

function _createToolTitle(item, roll) {
    let title = game.i18n.localize("DND5E.ToolCheck");

    if (roll.terms[0].options.advantage) {
        title += ` (${game.i18n.localize("DND5E.Advantage")})`;
    } else if (roll.terms[0].options.disadvantage) {
        title += ` (${game.i18n.localize("DND5E.Disadvantage")})`;
    }

    return title;
}

async function _replaceAbilityCheckButtonWithRollResult(messageData, roll, title) {
    const content = $(messageData.content);
    const cardContent = content.find(".card-content");
    cardContent.append("<hr />");

    const cardRoll = $(`<div class="card-roll">`);
    cardRoll.append(`<span class="flavor-text">${title}</span>`);
    cardRoll.append(await roll.render());

    cardContent.after(cardRoll);

    const buttonContainer = content.find(".card-buttons");
    if (buttonContainer.find("button").length > 1) buttonContainer.before("<hr />");
    content.find("[data-action=attack],[data-action=toolCheck]").remove();

    messageData.content = content.prop("outerHTML");
}
