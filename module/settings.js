export const registerSystemSettings = function() {

  /**
   * Track the system version upon which point a migration was last applied
   */
  game.settings.register("scum-and-villainy", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: Number,
    default: 0
  });
  
  game.settings.register("scum-and-villainy", "defaultClockTheme", {
    name: "BITD.ClockSettingDefaultTheme",
    scope: "world",
    config: true,
    type: Number,
    choices: CONFIG.clocks.choices,
	default: 0,
	icon: "fas fa-palette"
  });
  
};

const CONFIG = window.CONFIG = {

  clocks: {

    choices: ["blue", "red", "yellow", "green"]

  }
  
};