export class SaVHelpers {

  /**
   * Removes a duplicate item type from charlist.
   * 
   * @param {Object} item_data 
   * @param {Entity} actor 
   */
  static removeDuplicatedItemType(item_data, actor) {

    let distinct_types = ["crew_reputation", "class", "background", "vice", "heritage", "ship_size", "crew_type"];
    let should_be_distinct = distinct_types.includes(item_data.type);
    // If the Item has the exact same name - remove it from list.
    // Remove Duplicate items from the array.
    actor.items.forEach(i => {
      let has_double = (item_data.type === i.data.type);
      if (i.data.name === item_data.name || (should_be_distinct && has_double)) {
        actor.deleteOwnedItem(i.id);
      }
    });
  }

  /**
   * Adds default abilities when class is chosen for character
   * 
   * @param {Object} item_data 
   * @param {Entity} actor 
   */
  static async addDefaultAbilities(item_data, actor) {

    let def_abilities = item_data.data.def_abilities;
	let abil_list = def_abilities.split(', ');
	var item_type = "";
	let items_to_add = [];
	
	if ( actor.data.type == "character" ) {
		item_type = "ability";
	} else if ( actor.data.type == "ship" ) {
		item_type = "crew_upgrade";
	};
	
	let abilities = actor.items.filter(a => a.type === item_type).map(e => {return e.data.name});
	
	if ( actor.data.type == "ship" ) {
		
		let size = actor.items.filter(a => a.type === "ship_size").map(e => {return e.data.name}) || [""];
		//console.log(size);
		if ( size.length > 0 ) { abilities.push( size ); };
		
	};
	
	
		
		let friends = actor.items.filter(a => a.type === "friend").map(e => {return e.data.name}) || [""];
		if ( friends.length > 0 ) { abilities.push( friends ); };
		
	
	
	//console.log(abilities);
	
	let items = await SaVHelpers.getAllItemsByType(item_type, game);
	
	if ( actor.data.type == "ship" ) {
		
		let all_sizes = await SaVHelpers.getAllItemsByType("ship_size", game);
		all_sizes.forEach( s => { items.push( s ); });
		//console.log(items);
	}
	
	
		
		let all_friends = await SaVHelpers.getAllItemsByType("friend", game);
		all_friends.forEach( s => { items.push( s ); });

	
    let trim_abil_list = abil_list.filter( x => !abilities.includes( x ) );
	//console.log(trim_abil_list);
	trim_abil_list.forEach(i => {
			
			items_to_add.push( items.find( e => ( e.name === i ) ));
		  
    });
    
	//console.log(items_to_add);
	actor.createEmbeddedEntity("OwnedItem", items_to_add);
	
  }


  /**
   * Add item modification if logic exists.
   * @param {Object} item_data 
   * @param {Entity} entity 
   */
  static callItemLogic(item_data, entity) {

    if ('logic' in item_data.data && item_data.data.logic !== '') {
      let logic = JSON.parse(item_data.data.logic);

      // Should be an array to support multiple expressions
      if (!Array.isArray(logic)) {
        logic = [logic];
      }

      if (logic) {

        logic.forEach(expression => {

          // Different logic behav. dep on operator.
          switch (expression.operator) {
    
            // Add when creating.
            case "addition":
              entity.update({
                [expression.attribute]: Number(SaVHelpers.getNestedProperty(entity, "data." + expression.attribute)) + expression.value
              });
              break;

            // Change name property.
            case "attribute_change":
              entity.update({
                [expression.attribute]: expression.value
              });
              break;
    
          }
        });
      }

    }

  }

  /**
   * Undo Item modifications when item is removed.
   * @todo
   *  - Remove all items and then Add them back to
   *    sustain the logic mods
   * @param {Object} item_data 
   * @param {Entity} entity 
   */
  static undoItemLogic(item_data, entity) {

    if ('logic' in item_data.data && item_data.data.logic !== '') {
      let logic = JSON.parse(item_data.data.logic)

      // Should be an array to support multiple expressions
      if (!Array.isArray(logic)) {
        logic = [logic];
      }

      if (logic) {

        var entity_data = entity.data;

        logic.forEach(expression => {
          // Different logic behav. dep on operator.
          switch (expression.operator) {

            // Subtract when removing.
            case "addition":
              entity.update({
                [expression.attribute]: Number(SaVHelpers.getNestedProperty(entity, "data." + expression.attribute)) - expression.value
              });
              break;

            // Change name back to default.
            case "attribute_change":
              // Get the array path to take data.
              let default_expression_attribute_path = expression.attribute + '_default';
              let default_name = default_expression_attribute_path.split(".").reduce((o, i) => o[i], entity_data);

              entity.update({
                [expression.attribute]: default_name
              });
              break;
          }
        });
      }
    }

  }

  /**
   * Get a nested dynamic attribute.
   * @param {Object} obj 
   * @param {string} property 
   */
  static getNestedProperty(obj, property) {
    return property.split('.').reduce((r, e) => {
        return r[e];
    }, obj);
  }


  /**
   * Add item functionality
   */
  static _addOwnedItem(event, actor) {

    event.preventDefault();
    const a = event.currentTarget;
    const item_type = a.dataset.itemType;

    let data = {
      name: randomID(),
      type: item_type
    };
    return actor.createEmbeddedEntity("OwnedItem", data);
  }

  /**
   * Get the list of all available ingame items by Type.
   * 
   * @param {string} item_type 
   * @param {Object} game 
   */
  static async getAllItemsByType(item_type, game) {

    let list_of_items = [];
    let game_items = [];
    let compendium_items = [];
    
    game_items = game.items.filter(e => e.type === item_type).map(e => {return e.data});
	//console.log(game_items);
    let pack = game.packs.find(e => e.metadata.name === item_type);
    //console.log(pack);
	let compendium_content = await pack.getContent();
	//console.log(compendium_content);
    compendium_items = compendium_content.map(k => {return k.data});
	//console.log(compendium_items);
	
	compendium_items = compendium_items.filter(a => game_items.filter(b => a.name === b.name && a.name === b.name).length === 0);
	
	//console.log(compendium_items);
	
    list_of_items = game_items.concat(compendium_items);
	//console.log(list_of_items);
    return list_of_items;

  }

  static async getAllActorsByType(item_type, game) {

    let game_actors = [];
        
    game_actors = game.actors.filter(e => e.data.type === item_type).map(e => {return e.data});

    return game_actors;

  }

  /* -------------------------------------------- */

  /**
   * Returns the label for attribute.
   *
   * @param {string} attribute_name 
   * @returns {string}
   */
  static getAttributeLabel(attribute_name) {
        // Calculate Dice to throw.
        let attribute_labels = {};
        
		// There has to be a better way to to do this
		// @todo - pull skill list dynamically
		const skills = ["insight","doctor","hack","rig","study","prowess","helm","scramble","scrap","skulk","resolve","attune","command","consort","sway"];
		const systems = ["crew","upkeep","engines","comms","weapons","hull","shields","encryptor"];
		
		if (skills.indexOf(attribute_name) !== -1 ) {
			
			var attributes = game.system.model.Actor.character.attributes;
		//	console.log("character");
			
		} else if (systems.indexOf(attribute_name) !== -1 ) {
			
			var attributes = game.system.model.Actor.ship.systems;
		//	console.log("ship");
			
		} else {
		
			return attribute_name;
			
		}
		
		// console.log(attribute_name);
		// console.log(attributes);
			
        for (var a in attributes) {
          attribute_labels[a] = attributes[a].label;
          for (var skill_name in attributes[a].skills) {
            attribute_labels[skill_name] = attributes[a].skills[skill_name].label;
          }
    
        }
    
        return attribute_labels[attribute_name];
  }

  /* -------------------------------------------- */
  
  static Romanize(num) {
    if (isNaN(num))
        return NaN;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
  }
  
}
