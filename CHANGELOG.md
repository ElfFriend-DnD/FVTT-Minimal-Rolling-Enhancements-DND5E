# CHANGELOG

## Legacy Changelog
Since taking over this project, I haven't been updating this changelog. Refer instead to the [releases page.](https://github.com/ElfFriend-DnD/FVTT-Minimal-Rolling-Enhancements-DND5E/releases)

## [3.0.0] 2021-10-16
Big Refactor of the patches to reduce complexity. Behavior for users is largely unchanged with one exception:

### Auto Roll Attack
Item Card no longer replaces the attack button (or use tool button) with the roll outcome for automatic item checks, instead a standard 5e attack roll/ability check card is created. This has several benefits:

- Spells like Spiritual Weapon which warrant several attack rolls after being popped out are easier to use.
- There is dramatically less complexity in the Item#roll override.
- Allows modules like Automated Animations to do less work to detect an Attack Roll.

## [2.0.4] 2021-09-03
I'm not super sure how #2's item got configured that way but at least now we won't choke on it.

## [2.0.2] 2021-08-28
Avoid crash on temporary item creation. Thanks @TheGiddyLimit

## [2.0.1] 2021-08-20

Fixes some Flags and Dice

### FIXED

- Updates the damage workflow to fit new Dice results.
- Fixes flag creation on chat messages.

## [2.0.0] 2021-06-05

*Core 0.8.x and dnd5e 1.3.x compatibility*

### FIXED

- Fixed usages of a number of deprecated and renamed core functions.
- Fixed some issues that would cause item cards with embedded rolls and combined damage roll cards from rendering in the chat log.
- Fixed an issue that would cause the "show dialog" modifier key to not function if the default roll dialog behavior was set to "skip".

## [1.0.9] 2021-04-07

### FIXED

- Fixed an issue that would cause the other formula "Auto Roll" button in the item sheet to not work correctly.

## [1.0.8] 2021-03-31

### CHANGED

- Ensure that that item cards with embedded check rolls add the proper core dnd5e flags to indicate roll type.
  - This should increase compatibility with other modules which key off of that flag

## [1.0.7] 2021-03-27

### API

- `patchedRollDamage` now matches the return signature of the original `rollDamage` method.
  - Previously it would return an array of damage part rolls, now it returns a single roll containing the combined results of all individual part rolls.
  - This is a breaking API change, but should not affect normal users.

### FIXED

- Fixed an issue that would cause some options passed to d20 roll functions to be overwritten.

## [1.0.6] 2021-03-24

### CHANGED

- When auto roll checks is on, and the user quits out of the roll dialog for the check without rolling, abort the item roll.

### FIXED

- Fixed an issue that would cause items without attack rolls to ignore the critical modifier key for auto damage rolls.

## [1.0.5] 2021-02-23

### FIXED

- Fixed an issue that would cause tools or other items that don't have damage to not show in character sheets
- Fixed an issue that would cause weapons with versatile damage to have an empty primary formula group when MRE was first enabled or the item was first imported.
- Fixed an issue that would prevent damage from rolling as critical damage when auto roll checks and auto roll damage were both enabled.
- Fixed an issue that would cause auto damage to be rolled as critical when holding the advantage modifier key to roll the auto attack roll with advantage.

## [1.0.4] 2021-02-19

### FIXED

- Fixed an issue that would prevent the formula group config from being edited if there was one or fewer formula groups, or one or fewer damage formulae on the item.

### CHANGED

- When the first damage formula is added to an item, or if an item does not have any formulae assigned to any formula groups, assign all formulae to the first formula group.

## [1.0.3] 2021-02-13

### FIXED

- Fixed an issue that would prevent items which had been destroyed on consumption from working correctly

## [1.0.2] 2021-01-26

### FIXED

- Fixed an issue that would cause items without an attack roll or tool check to fail to show an item card in chat when rolled.

## [1.0.1] 2021-01-26

### ADDED

- Add a setting to toggle between skipping or showing the roll dialog when no modifier keys are held. This defaults to skipping the dialog.

### FIXED

- Fixed an issue which would cause the damage buttons to be placed above the attack button in an item card when auto roll checks was disabled.

### CHANGED

- Relaxed minimum core version to 0.7.5. This hasn't been tested, so use on versions lower than 0.7.9 at your own risk.

## [1.0.0] 2021-01-24

*First official release. No code or behavior changes*

## [0.1.5] 2021-01-20

### ADDED

- Add a setting which, when enabled, will show the total summed damage at the bottom of a combined damage card.

## [0.1.4] 2021-01-20

### ADDED

- When auto roll checks *and* auto roll damage are both enabled,
  MRE will now automatically roll critical damage when the attack roll was a critical hit.
  
### CHANGED

- Improve styling and layout when used with Tidy5e Sheet

### FIXED

- Fixed an issue where applying damage via the context menu in a damage card would incorrectly apply no damage.

## [0.1.3] 2021-01-18

### ADDED

- When the "Advantage/Critical" modifier key is held while clicking on a damage roll, the damage will be rolled as a critical

### FIXED

- Fix an issue that would cause damage buttons to appear in item cards for items with no damage formulae defined

## [0.1.2] 2021-01-17

### CHANGED

- If an item damage formula does not have a type defined, default to "Damage" for the damage type in the damage chat card.
- Prevent a user from adding more formula groups to an item if it already has 7 or more formula groups.

### FIXED

- Fix an issue that could occur if an item had a versatile formula defined, but no damage parts defined.

## [0.1.1] 2021-01-16

### ADDED

- You can now right click on individual damage rolls within an individual damage card to selectively apply damage for that roll only.

### CHANGED

- Changed the icon for the "revert to default" state of the auto rolls 3-way checkboxes to an open circle.

### FIXED

- Fixed an issue caused by programmatically calling rollAttack or rollDamage with no arguments.
- Fixed the damage type for a damage formula of type "None" displaying as "undefined".

## [0.1.0] 2021-01-15

First release!
