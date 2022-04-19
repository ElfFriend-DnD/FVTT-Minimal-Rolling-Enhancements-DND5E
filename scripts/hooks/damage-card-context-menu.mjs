// TODO remove after 0.8.0. See: https://gitlab.com/foundrynet/foundryvtt/-/issues/4495
ContextMenu.prototype.bind = function patchedBind() {
    this.element.on(this.eventName, this.selector, event => {
        event.preventDefault();
        let parent = $(event.currentTarget),
            menu = this.menu;

        // Remove existing context UI
        $('.context').removeClass("context");

        // Close the current context
        if ( $.contains(parent[0], menu[0]) ) this.close();

        // If the new target element is different
        else {
            event.stopPropagation();
            this.render(parent);
            ui.context = this;
        }
    });
}

/**
 * Register a new context menu to be applied to individual damage rolls in a combined damage card
 */
Hooks.once("renderChatLog", async () => {
    let canApply = li => {
        const message = game.messages.get(li.closest(".chat-message").data("messageId"));
        return message.isContentVisible && canvas.tokens.controlled.length;
    };
    const contextOptions = [
        {
            name: game.i18n.localize("DND5E.ChatContextDamage"),
            icon: "<i class=\"fas fa-user-minus\"></i>",
            condition: canApply,
            callback: li => _applyDiceResultDamage(li, 1),
        },
        {
            name: game.i18n.localize("DND5E.ChatContextHealing"),
            icon: "<i class=\"fas fa-user-plus\"></i>",
            condition: canApply,
            callback: li => _applyDiceResultDamage(li, -1),
        },
        {
            name: game.i18n.localize("DND5E.ChatContextDoubleDamage"),
            icon: "<i class=\"fas fa-user-injured\"></i>",
            condition: canApply,
            callback: li => _applyDiceResultDamage(li, 2),
        },
        {
            name: game.i18n.localize("DND5E.ChatContextHalfDamage"),
            icon: "<i class=\"fas fa-user-shield\"></i>",
            condition: canApply,
            callback: li => _applyDiceResultDamage(li, 0.5),
        },
    ];
    new ContextMenu(ui.chat.element, ".mre-damage-card .dice-result", contextOptions);
});

function _applyDiceResultDamage(roll, multiplier) {
    const amount = roll.find('.dice-total').text();
    return Promise.all(canvas.tokens.controlled.map(t => {
        const a = t.actor;
        return a.applyDamage(amount, multiplier);
    }));
}
