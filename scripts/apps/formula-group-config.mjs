import { MODULE_NAME } from "../const.mjs";
import { createNewFormulaGroup } from "../formula-group.mjs";

const MAX_FORMULA_GROUPS = 7;

export class FormulaGroupConfig extends DocumentSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: [ "dnd5e", "mre-formula-group-config" ],
            template: "modules/mre-dnd5e/templates/formula-group-config.hbs",
            width: "auto",
            height: "auto",
            closeOnSubmit: false,
            submitOnClose: true,
            submitOnChange: true,
        });
    }

    /** @override */
    get title() { return `${game.i18n.localize(`${MODULE_NAME}.FORMULA-GROUP.DialogTitle`)}: ${this.document.name}`; }

    /** @override */
    getData(options) {
        const itemData = this.document.data.data;
        const formulaGroupData = this._getFormulaGroupData();
        const emptyString = game.i18n.localize(`${MODULE_NAME}.FORMULA-GROUP.Empty`)
        return {
            formulas: itemData.damage.parts.map(p => ({
                formula: p[0]?.trim()?.length ? p[0] : `<${emptyString}>`,
                type: p[1],
                typeLabel: CONFIG.DND5E.damageTypes[p[1]] ?? CONFIG.DND5E.healingTypes[p[1]] ?? game.i18n.localize("DND5E.None"),
            })),
            formulaGroups: formulaGroupData,
            canAdd: formulaGroupData.length < MAX_FORMULA_GROUPS,
        };
    }

    _getFormulaGroupData() {
        /** @type FormulaGroup[] */
        const groups = foundry.utils.deepClone(this.document.getFlag(MODULE_NAME, "formulaGroups"));
        const totalFormulaCount = this.document.data.data.damage.parts.length;
        return groups.map(g => ({
            label: g.label,
            containsFormula: (new Array(totalFormulaCount)).fill(false).map((_, i) => g.formulaSet.includes(i)),
        }));
    }

    /** @override */
    _getHeaderButtons() {
        const existing = super._getHeaderButtons()
        if (!this.isEditable) return existing;

        // Remove all buttons except for the "Close" button, and re-label it to "Save & Close"
        const closeButton = existing[existing.length - 1];
        closeButton.label = game.i18n.localize(`${MODULE_NAME}.FORMULA-GROUP.SaveAndClose`);
        return [closeButton];
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if (this.isEditable) {
            html.find(".add-formula-group").click(this._handleAddFormulaGroup.bind(this));
            html.find(".delete-formula-group").click(this._handleDeleteFormulaGroup.bind(this));
        }
    }

    async _handleAddFormulaGroup() {
        const groups = foundry.utils.deepClone(this.document.data.flags[MODULE_NAME].formulaGroups);
        groups.push(createNewFormulaGroup({ index: groups.length }));
        await this.document.update({ [`flags.${MODULE_NAME}.formulaGroups`]: groups });
        this.renderResetWidth();
    }

    async _handleDeleteFormulaGroup(event) {
        const index = event.currentTarget.dataset.groupIndex;
        const groups = foundry.utils.deepClone(this.document.data.flags[MODULE_NAME].formulaGroups);
        groups.splice(index, 1);
        await this.document.update({ [`flags.${MODULE_NAME}.formulaGroups`]: groups });
        this.renderResetWidth();
    }

    _getSubmitData(updateData={}) {
        const data = super._getSubmitData(updateData);
        const dataExploded = foundry.utils.expandObject(data);

        // make up for the v9 change to checkboxes by contructing the array how it looked in v8
        const formulaGroupContains = Object.values(dataExploded.formulaGroupContains).map((valueObj) => Object.values(valueObj));

        return {...dataExploded, formulaGroupContains};
    }

    /** @override */
    async _updateObject(event, formData) {
        if (!this.isEditable) return;

        formData = foundry.utils.expandObject(formData);

        // If there are no formula groups in the form or no formulae to be in groups, quit early
        if (!formData.formulaGroupLabels?.length || !formData.formulaGroupContains) return;

        // Ensure that things that should be arrays are actually arrays
        formData.formulaGroupLabels = formData.formulaGroupLabels instanceof Array ? formData.formulaGroupLabels : [formData.formulaGroupLabels];
        formData.formulaGroupContains = Object.values(formData.formulaGroupContains).map(x => x instanceof Array ? x : [x]);

        // Create formula groups flag from properly formatted form data.
        const formulaGroups = formData.formulaGroupLabels.map((groupLabel, groupIdx) => ({
            label: groupLabel,
            formulaSet: formData.formulaGroupContains[groupIdx].map((x, i) => x ? i : null).filter(x => x != null),
        }));

        // if this change would cause all formula groups to be empty, cancel
        const allGroupsEmpty = formulaGroups.every(fg => !fg.formulaSet.length);
        if (allGroupsEmpty) {
            ui.notifications.warn(game.i18n.localize(`${MODULE_NAME}.FORMULA-GROUP.GroupsMustNotBeEmpty`));
            this.render(true);
            return;
        }

        await this.document.setFlag(MODULE_NAME, "formulaGroups", formulaGroups);
        this.renderResetWidth();
    }

    renderResetWidth() {
        this.element[0].style.width = null
        this.render(true);
    }
}
