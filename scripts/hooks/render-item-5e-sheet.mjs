import { MODULE_NAME } from "../const.mjs";
import { FormulaGroupConfig } from "../apps/formula-group-config.mjs";

Hooks.on("renderItemSheet5e", (itemSheet, html, _) => {
    // Add formula group config button
    const tooltip = game.i18n.localize(`${MODULE_NAME}.FORMULA-GROUP.DialogTitle`);
    html.find(".tab.details .damage-header").prepend(`<a title="${tooltip}" class="config-formula-groups"><i class="fas fa-tasks"></i></a>`);

    // Open the formula group config when the user clicks on the button
    html.find(".config-formula-groups").click(() => new FormulaGroupConfig(itemSheet.document, { editable: itemSheet.isEditable }).render(true) );

    // Remove versatile fields
    html.find(`.tab.details input[name="data.damage.versatile"]`).closest(".form-group").remove();

    // Add auto-roll checkbox buttons
    if (itemSheet.item.data.data.actionType?.length) {
        // Only show the auto-roll checkbox button if actionType is populated
        const actionType = html.find(`.tab.details`).find(`[name="data.actionType"]`);
        actionType.wrap(`<div class="form-fields">`);
        actionType.after(_makeAutoRollCheckboxElement(itemSheet.document, "Attack", true));
    }

    const damageHeader = html.find(".tab.details .damage-header");
    damageHeader.wrap(`<div class="mre-damage-header-container">`);
    damageHeader.after(_makeAutoRollCheckboxElement(itemSheet.document, "Damage", true));

    const otherFormula = html.find(`.tab.details`).find(`[name="data.formula"]`);
    otherFormula.after(_makeAutoRollCheckboxElement(itemSheet.document, "Other", false));

    // Handle "checkbox" button clicks
    html.on('click', `.tab.details button.checkbox:not(.three-way)`, (event) => _handleTwoWayCheckboxButtonPress(event, itemSheet.document));
    html.on('click', `.tab.details button.checkbox.three-way`, (event) => _handleThreeWayCheckboxButtonPress(event, itemSheet.document));
});

// only present if the Items With Rollable Tables module is present
Hooks.on('items-with-rolltables-5e.sheetMutated', (itemSheet, html) => {
    const rollableTable = html.find(`.tab.details`).find('.rollable-table-drop-target');
    rollableTable.append(_makeAutoRollCheckboxElement(itemSheet.document, "Rolltable", true));
})

function _makeAutoRollCheckboxElement(item, target, threeWay) {
    const text = game.i18n.localize(`${MODULE_NAME}.AUTO-ROLL.AutoRoll`);
    const element = $(`<div class="mre-auto-roll"><button class="checkbox"></button><span class="label">${text}</span></div>`);

    const flag = item.getFlag(MODULE_NAME, `autoRoll${target}`);
    const state = threeWay ? _stateFromNullableBoolean(flag) : _stateFromBoolean(flag);

    const button = element.find("button")
        .addClass(`${state.state}`)
        .attr("data-auto-roll-target", target)
        .attr("title", game.i18n.localize(state.tooltip));
    if (threeWay) button.addClass("three-way");

    return element;
}

function _stateFromBoolean(bool) {
    return {
        state: bool ? "checked" : "unchecked",
        tooltip: bool ? `${MODULE_NAME}.AUTO-ROLL.True` : `${MODULE_NAME}.AUTO-ROLL.False`
    }
}

const _threeWayTooltipKeys = {
    "unchecked": `${MODULE_NAME}.AUTO-ROLL.OverrideFalse`,
    "indeterminate": `${MODULE_NAME}.AUTO-ROLL.Default`,
    "checked": `${MODULE_NAME}.AUTO-ROLL.OverrideTrue`,
}

function _stateFromNullableBoolean(bool) {
    const state= bool === undefined ? "indeterminate" : ( bool ? "checked" : "unchecked" );
    return { state, tooltip: _threeWayTooltipKeys[state], };
}

function _handleTwoWayCheckboxButtonPress(event, item) {
    const el = event.currentTarget;
    const target = el.dataset.autoRollTarget;
    const button = $(el);

    if (button.hasClass("checked")) {
        // Checkbox is currently checked, next state is unchecked
        item.unsetFlag(MODULE_NAME, `autoRoll${target}`);
    } else {
        // Checkbox is currently unchecked, next state is checked
        item.setFlag(MODULE_NAME, `autoRoll${target}`, true);
    }
}

function _handleThreeWayCheckboxButtonPress(event, item) {
    const el = event.currentTarget;
    const target = el.dataset.autoRollTarget;
    const button = $(el);

    if (button.hasClass("checked")) {
        // Checkbox is currently checked, next state is unchecked
        item.setFlag(MODULE_NAME, `autoRoll${target}`, false);
    } else if (button.hasClass("indeterminate")) {
        // Checkbox is currently indeterminate, next state is checked
        item.setFlag(MODULE_NAME, `autoRoll${target}`, true);
    } else {
        // Checkbox is currently unchecked, next state is indeterminate
        item.unsetFlag(MODULE_NAME, `autoRoll${target}`);
    }
}
