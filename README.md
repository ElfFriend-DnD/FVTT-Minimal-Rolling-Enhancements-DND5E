# Minimal Rolling Enhancements (MRE) for D&D5e

Some minimalist enhancements to the core D&D5e rolling workflow.
MRE is intended to stay as close as possible to core behavior while improving convenience.
A key philosophy for this module is to remain non-disruptive to minimize conflicts with system and core updates.

MRE is targeted at a low-automation workflow.
If you are looking for high levels of automation, you should consider using other modules.

## Features

Visit the [User Guide](https://github.com/ElfFriend-DnD/FVTT-Minimal-Rolling-Enhancements-DND5E/wiki/User-Guide) for more information on each feature and informative screenshots.

![A screenshot of a weapon chat card displaying a variety of MRE features](https://f002.backblazeb2.com/file/cws-images/FVTT-MRE/flame-tongue.webp)

- MRE **inverts the default dialog behavior** for attack rolls, ability check rolls, save rolls, skill rolls, and damage rolls.
  - With no modifier keys held, these rolls will happen instantly, rather than showing the dialog.
    Holding the appropriate configurable modifier key will cause the dialog to appear when you need it.
- **Configurable modifier keys** for rolling with advantage, disadvantage, and showing the roll dialog.
  - You can set world-level default modifiers, but players may choose to set a local override if they wish.
- Settings to **automatically roll attack rolls** and/or **damage rolls** when an item is rolled from the character sheet or a macro.
  - These global settings can be overridden on a per-item basis for full configurability.
- **Formula groups** allow for you to configure sets of damage formulae to be rolled together.
- Distinct damage formulae within a damage roll are **displayed separately**, for ease of selectively applying resistance/vulnerability.

## Compatibility

Not compatible with other modules which modify D&D5e item rolls.

Minimal Rolling Enhancements is compatible with [libWrapper](https://foundryvtt.com/packages/lib-wrapper/),
however installing the libWrapper module is *optional*.
You are not required to install libWrapper for MRE to work correctly, however installing it may reduce conflicts with other modules.

### [Items with Rollable Tables](https://github.com/ElfFriend-DnD/foundryvtt-items-with-rolltables-5e)

Fully supported, including options to automatically roll the rollable table when the item is rolled.

### PopOut!

Using Alt/Shift/Control modifier keys from popped out sheets to bypass item roll dialogs is not supported.

## License

Licensed under the GPLv3 License (see [LICENSE](LICENSE)).
