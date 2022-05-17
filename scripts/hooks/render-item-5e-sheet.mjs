import { MODULE_NAME } from "../const.mjs";
import { FormulaGroupConfig } from "../apps/formula-group-config.mjs";

Hooks.on("renderItemSheet5e", (itemSheet, html, _) => {
    const locked = !itemSheet.isEditable;

    // Add formula group config button
    const tooltip = game.i18n.localize(`${MODULE_NAME}.FORMULA-GROUP.DialogTitle`);
    const damageHeader = html.find(".tab.details .damage-header");
    damageHeader.wrap(`<div class="mre-damage-header-container">`);
    damageHeader.before(`<a title="${tooltip}" class="config-formula-groups"><i class="fas fa-tasks"></i></a>`);
    damageHeader.after(_makeAutoRollCheckboxElement(itemSheet.document, "Damage", true, locked));

    // Open the formula group config when the user clicks on the button
    html.find(".config-formula-groups").click(() => new FormulaGroupConfig(itemSheet.document, { editable: itemSheet.isEditable }).render(true) );

    // Remove versatile fields
    html.find(`.tab.details input[name="data.damage.versatile"]`).closest(".form-group").remove();

    // Add auto-roll checkbox buttons
    if (itemSheet.item.data.data.actionType?.length) {
        // Only show the auto-roll checkbox button if actionType is populated
        const actionType = html.find(`.tab.details`).find(`[name="data.actionType"]`);
        actionType.wrap(`<div class="form-fields">`);
        actionType.after(_makeAutoRollCheckboxElement(itemSheet.document, "Attack", true, locked));
    }

    const otherFormula = html.find(`.tab.details`).find(`[name="data.formula"]`);
    otherFormula.after(_makeAutoRollCheckboxElement(itemSheet.document, "Other", false, locked));

    if (!locked) {
        // Handle "checkbox" button clicks
        html.on('click', `.tab.details input[type=checkbox]:not(.three-way)`, (event) => _handleTwoWayCheckboxButtonPress(event, itemSheet.document));
        html.on('click', `.tab.details input[type=checkbox].three-way`, (event) => _handleThreeWayCheckboxButtonPress(event, itemSheet.document));
    }
});

// only present if the Items With Rollable Tables module is present
Hooks.on('items-with-rolltables-5e.sheetMutated', (itemSheet, html) => {
    const locked = !itemSheet.isEditable;
    const rollableTable = html.find(`.tab.details`).find('.rollable-table-drop-target');
    rollableTable.append(_makeAutoRollCheckboxElement(itemSheet.document, "Rolltable", true, locked));
})

function _makeAutoRollCheckboxElement(item, target, threeWay, locked) {
    const text = game.i18n.localize(`${MODULE_NAME}.AUTO-ROLL.AutoRoll`);
    const element = $(`<label class="mre-auto-roll"><input type="checkbox" /><span class="label">${text}</span></label>`);

    const flag = item.getFlag(MODULE_NAME, `autoRoll${target}`);
    const tooltip = threeWay ? _threeWayTooltip(flag) : _twoWayTooltip(flag);
    element.prop("title", game.i18n.localize(tooltip));

    const checkbox = element.find("input[type=checkbox]")[0];
    checkbox.checked = flag;
    checkbox.dataset.autoRollTarget = target;
    checkbox.disabled = locked
    if (threeWay) {
        checkbox.indeterminate = flag === undefined;
        checkbox.dataset.state = _threeWayState(flag);
        checkbox.classList.add("three-way");
    }

    return element;
}

function _twoWayTooltip(bool) {
    return bool ? `${MODULE_NAME}.AUTO-ROLL.True` : `${MODULE_NAME}.AUTO-ROLL.False`;
}

function _threeWayTooltip(nullableBool) {
    if (nullableBool === undefined) return `${MODULE_NAME}.AUTO-ROLL.Default`;
    if (nullableBool) return `${MODULE_NAME}.AUTO-ROLL.OverrideTrue`;
    else return `${MODULE_NAME}.AUTO-ROLL.OverrideFalse`;
}

function _threeWayState(nullableBool) {
    if (nullableBool === undefined) return 0;
    if (nullableBool) return 1;
    else return 2;
}

function _handleTwoWayCheckboxButtonPress(event, item) {
    const el = event.currentTarget;
    const target = el.dataset.autoRollTarget;

    if (el.checked) {
        // Checkbox changing from unchecked to checked
        item.setFlag(MODULE_NAME, `autoRoll${target}`, true);
    } else {
        // Checkbox changing from checked to unchecked
        item.unsetFlag(MODULE_NAME, `autoRoll${target}`);
    }

    return true;
}

function _handleThreeWayCheckboxButtonPress(event, item) {
    event.preventDefault();
    const el = event.currentTarget;
    const target = el.dataset.autoRollTarget;
    const prevState = isFinite(el.dataset.state) ? parseInt(el.dataset.state) : 1;

    switch (prevState) {
        case 0: // checkbox changing from indeterminate to checked
            item.setFlag(MODULE_NAME, `autoRoll${target}`, true);
            break
        case 1: // checkbox changing from checked to unchecked
            item.setFlag(MODULE_NAME, `autoRoll${target}`, false);
            break;
        case 2: // checkbox changing from unchecked to indeterminate
            item.unsetFlag(MODULE_NAME, `autoRoll${target}`);
            break;

    }

    el.dataset.state = (prevState + 1) % 3;

    return false;
}
