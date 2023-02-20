((function () {
	'use strict';
	//TODO: make this variable based on user input
	let cutoff = 100;

    let defMouseScore = 
        {Arcane: 0,
        Draconic: 0,
        Forgotten: 0,
        Hydro: 0,
        Law:0,
        Parental: 0,
        Physical : 0,
        Rift: 0,
        Shadow: 0,
        Tactical:0
    }
	let defMouseTypeList = {Arcane: [],
        Draconic: [],
        Forgotten: [],
        Hydro: [],
        Law:[],
        Parental: [],
        Physical : [],
        Rift: [],
        Shadow: [],
        Tactical:[]
    }
	let mouseTypeList, mouseScore;
	/**
	 * Add styles to the page.
	 *
	 * @param {string} styles The styles to add.
	 */
	const addStyles = (styles) => {
		// Check to see if the existing element exists.
		const existingStyles = document.getElementById('mh-mouseplace-custom-styles');

		// If so, append our new styles to the existing element.
		if (existingStyles) {
			existingStyles.innerHTML += styles;
			return;
		}

		// Otherwise, create a new element and append it to the head.
		const style = document.createElement('style');
		style.id = 'cmt-styles';
		style.innerHTML = styles;
		document.head.appendChild(style);
	};
	/**
	 * POST a request to the server and return the response.
	 *
	 * @param {string} url      The url to post to, not including the base url.
	 * @param {Object} formData The form data to post.
	 *
	 * @return {Promise} The response.
	 */
	const doRequest = async (url, formData) => {
		// If we don't have the needed params, bail.
		if ('undefined' === typeof user || ! user || 'undefined' === typeof user.unique_hash || ! user.unique_hash) { // eslint-disable-line no-undef
			return;
		}

		// Build the form for the request.
		const form = new FormData();
		form.append('sn', 'Hitgrab');
		form.append('hg_is_ajax', 1);
		form.append('uh', user.unique_hash ? user.unique_hash : ''); // eslint-disable-line no-undef

		// Add in the passed in form data.
		for (const key in formData) {
			form.append(key, formData[ key ]);
		}

		// Convert the form to a URL encoded string for the body.
		const requestBody = new URLSearchParams(form).toString();

		// Send the request.
		const response = await fetch(
			callbackurl ? callbackurl + url : 'https://www.mousehuntgame.com/' + url, // eslint-disable-line no-undef
			{
				method: 'POST',
				body: requestBody,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			}
		);

		// Wait for the response and return it.
		const data = await response.json();
		return data;
	};

	/**
	 *  Add a submenu item to a menu.
	 *
	 * @param {Object} options The options for the submenu item.
	 */
	const addSubmenuItem = (options) => {
		// Default to sensible values.
		const settings = Object.assign({}, {
			menu: 'kingdom',
			label: '',
			icon: '',
			href: '',
			callback: null,
			external: false,
		}, options);


		// Grab the menu item we want to add the submenu to.
		const menuTarget = document.querySelector(`.mousehuntHud-menu .${ settings.menu }`);
		if (! menuTarget) {
			return;
		}

		// If the menu already has a submenu, just add the item to it.
		if (! menuTarget.classList.contains('hasChildren')) {
			menuTarget.classList.add('hasChildren');
		}

		let submenu = menuTarget.querySelector('ul');
		if (! submenu) {
			submenu = document.createElement('ul');
			menuTarget.appendChild(submenu);
		}

		// Create the item.
		const item = document.createElement('li');

		// Add in our class.
		const menuSlug = settings.label.toLowerCase().replace(/ /g, '-');
		item.classList.add(`mh-submenu-item-${ menuSlug }`);

		if (settings.icon) {
			addStyles(`.mousehuntHud-menu .mh-submenu-item-${ menuSlug } .icon { background-image: url(${ settings.icon }); }`);
		}

		// Create the link.
		const link = document.createElement('a');
		link.href = settings.href || '#';

		if (settings.callback) {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				settings.callback();
			});
		}

		// Create the icon.
		const icon = document.createElement('div');
		icon.classList.add('icon');

		// Create the label.
		const name = document.createElement('div');
		name.classList.add('name');
		name.innerText = settings.label;

		// Add the icon and label to the link.
		link.appendChild(icon);
		link.appendChild(name);

		// If it's an external link, also add the icon for it.
		if (settings.external) {
			const externalLinkIcon = document.createElement('div');
			externalLinkIcon.classList.add('external_icon');
			link.appendChild(externalLinkIcon);

			// Set the target to _blank so it opens in a new tab.
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
		}

		// Add the link to the item.
		item.appendChild(link);

		// Add the item to the submenu.
		submenu.appendChild(item);
	};
	/**
	 * Get the mouse stats.
	 *
	 * @return {Object} The mouse stats.
	 */
	const getMouseStats = async () => {
		const data = await doRequest(
			'managers/ajax/mice/getstat.php',
			{
				action: 'get_hunting_stats',
			}
		);

		// Grab the data from the response.
		const mouseData = data?.hunting_stats
		
		// Reorder by the num_catches key.
		mouseData.sort((a, b) => {
			return a.num_catches - b.num_catches;
		});


		// Return the data.
		return mouseData ? mouseData : [];
	};

    const calculateScore = (stats) => {
		mouseScore = JSON.parse(JSON.stringify(defMouseScore));
		mouseTypeList = JSON.parse(JSON.stringify(defMouseTypeList));
        stats.forEach((mouse) => {
			let used = 0;
			let mname = mouse.name;
			if (mname.includes("Mouse")){
				mname = mname.slice(0, -6);
			}
			for (let i = 0; i < mouseCats.length; i++) {
				const cat = mouseCats[i];
				if (cat.mice.includes(mname)) {
				  if (mouse.num_catches >= cutoff) {
					mouseScore[cat.type] = mouseScore[cat.type] + 1;
				  }
				  mouseTypeList[cat.type].push(mouse);
				  used += 1;
				}
			  }
			if (used==0){
				mouseTypeList["Parental"].push(mouse);
			}
        })
		console.log(mouseScore);
		console.log(mouseTypeList);
		console.log(stats);
    }

    const buildScoreMarkup = (type)=>{
        for (const cat in mouseCats){
            if (mouseCats[cat].type == type){
                const typeEl = document.createElement('a');
                typeEl.classList.add('cmt-mice-stats');
                typeEl.title = type;
                // Create the image element.
                const image = document.createElement('div');
                image.classList.add('cmt-mice-stats-image');
                image.style.backgroundImage = `url('https://www.mousehuntgame.com/images/powertypes/${type.toLowerCase()}.png')`;
                // Create the name element.
                const name = document.createElement('div');
                name.classList.add('cmt-mice-stats-name');
                name.innerText = type;
                // Create a wrapper for the name and image.
                const imageNameContainer = document.createElement('div');
                imageNameContainer.appendChild(image);
                imageNameContainer.appendChild(name);
				// Create a flat element
				const flat = document.createElement('div');
				flat.classList.add('cmt-mice-stats-catches');
                let flatnumber = mouseScore[type] + " / " + (mouseCats[cat]["mice"].length);
				flat.innerText = flatnumber;
                // Create the percentage element.
                const percentage = document.createElement('div');
                percentage.classList.add('cmt-mice-stats-catches');
                let number = (100*mouseScore[type]/(mouseCats[cat]["mice"].length)).toFixed(1).padStart(4, '0');
                percentage.innerText = (number + "%").padEnd(6);
                // Add the image and name to the type element.
                typeEl.appendChild(imageNameContainer);
				typeEl.appendChild(flat);
                typeEl.appendChild(percentage);


                // console.log(100*mouseScore[type]/(mouseCats[cat]["mice"].length))
                return typeEl;

            }
        }
    }
    	/**
	 * Show the stat modal.
	 */
	const showModal = async () => {
		// First, check to make sure we have the element we want to append to.
		const target = document.querySelector('.pageFrameView-content');
		if (! target) {
			return;
		}

		// Remove the existing modal.
		const existing = document.getElementById('cmt-mice-stats');
		if (existing) {
			existing.remove();
		}

		// Create the modal.
		const modalWrapper = document.createElement('div');
		modalWrapper.id = 'cmt-mice-stats';

		// Create the wrapper.
		const modal = document.createElement('div');
		modal.classList.add('cmt-mice-stats-wrapper');

		// Create the header.
		const header = document.createElement('div');
		header.classList.add('cmt-mice-stats-header');

		// Add the title;
		const title = document.createElement('h1');
		title.innerText = 'Mouse Catch Stats';
		header.appendChild(title);

		// Create a close button icon.
		const closeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		closeIcon.classList.add('cmt-mice-stats-close');
		closeIcon.setAttribute('viewBox', '0 0 24 24');
		closeIcon.setAttribute('width', '18');
		closeIcon.setAttribute('height', '18');
		closeIcon.setAttribute('fill', 'none');
		closeIcon.setAttribute('stroke', 'currentColor');
		closeIcon.setAttribute('stroke-width', '1.5');

		// Create the path.
		const closePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		closePath.setAttribute('d', 'M18 6L6 18M6 6l12 12');
		closeIcon.appendChild(closePath);

		// Close the modal when the icon is clicked.
		closeIcon.addEventListener('click', () => {
			modalWrapper.remove();
		});

		// Append the button.
		header.appendChild(closeIcon);

		// Add the header to the modal.
		modal.appendChild(header);
//-----
		// Make the mouse stats table.
		const mouseBody = document.createElement('div');
		mouseBody.classList.add('cmt-mice-stats-body');
		// TODO: add column headers
		const mouseHeaders = document.createElement('div');
		mouseHeaders.classList.add('cmt-mice-stats');
		const mouseImageHeader = document.createElement('div');
		const mouseNameHeader = document.createElement('div');
		const mouseFlatHeader = document.createElement('div');
		const mousePercentHeader = document.createElement('div');
		mouseImageHeader.innerText = "____";
		mouseNameHeader.innerText = "Name";
		mouseFlatHeader.innerText = "Flat score";
		mousePercentHeader.innerText = "percentage score";
		mouseHeaders.appendChild(mouseImageHeader);
		mouseHeaders.appendChild(mouseNameHeader);
		mouseHeaders.appendChild(mouseFlatHeader);
		mouseHeaders.appendChild(mousePercentHeader);
		modal.appendChild(mouseHeaders);
		// Get the mouse stats.
		const mouseStats = await getMouseStats();

		// Loop through the stats and add them to the modal.
		calculateScore(mouseStats);
        for (const score in mouseScore){
			let result = buildScoreMarkup(score);
			result.addEventListener('click', () => {
				generateTypeDetails(score);
			});
			mouseBody.appendChild(result);

        }

		// Add the mouse stats to the modal.
		modal.appendChild(mouseBody);

		// Add the modal to the wrapper.
		modalWrapper.appendChild(modal);

		// Add the wrapper to the body.
		target.appendChild(modalWrapper);
	};
	const generateTypeDetails = async (score) => {
		// First, check to make sure we have the element we want to append to.
		const target = document.querySelector('.pageFrameView-content');
		if (! target) {
			return;
		}
		// Remove the existing modal.
		const existing = document.getElementById('cmt-type-details');
		if (existing) {
			existing.remove();
		}
		// Create the modal.
		const modalWrapper = document.createElement('div');
		modalWrapper.id = 'cmt-type-details';


		// Create the wrapper.
		const modal = document.createElement('div');
		modal.classList.add('cmt-type-details-wrapper');

		// Create the header.
		const header = document.createElement('div');
		header.classList.add('cmt-mice-stats-header');

		// Add the title;
		const title = document.createElement('h1');
		title.innerText = score + ' details';
		header.appendChild(title);

		// Create a close button icon.
		const closeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		closeIcon.classList.add('cmt-mice-stats-close');
		closeIcon.setAttribute('viewBox', '0 0 24 24');
		closeIcon.setAttribute('width', '18');
		closeIcon.setAttribute('height', '18');
		closeIcon.setAttribute('fill', 'none');
		closeIcon.setAttribute('stroke', 'currentColor');
		closeIcon.setAttribute('stroke-width', '1.5');

		// Create the path.
		const closePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		closePath.setAttribute('d', 'M18 6L6 18M6 6l12 12');
		closeIcon.appendChild(closePath);

		// Close the modal when the icon is clicked.
		closeIcon.addEventListener('click', () => {
			modalWrapper.remove();
		});

		// Append the button.
		header.appendChild(closeIcon);

		const mouseBody = document.createElement('div');
		mouseBody.classList.add('cmt-type-details-body');

		for (let mouse in mouseTypeList[score]){
			const mouseEl = document.createElement('a');
			if (mouseTypeList[score][mouse].num_catches>=cutoff){
				mouseEl.classList.add('cmt-mice-stats-finished');
			}else{
				mouseEl.classList.add('cmt-mice-stats');
			}
			console.log(mouse);
			//Create the image element
			const image = document.createElement('div');
			image.classList.add('cmt-mice-stats-image');
			image.style.backgroundImage = `url('${ mouseTypeList[score][mouse].thumb }')`;
			
			
			// Create the name element.
			const name = document.createElement('div');
			name.classList.add('cmt-mice-stats-name');
			name.innerText = mouseTypeList[score][mouse].name;

			// Create a wrapper for the name and image.
			const imageNameContainer = document.createElement('div');
			imageNameContainer.appendChild(image);
			imageNameContainer.appendChild(name);

			// Create the catches element.
			const catches = document.createElement('div');
			catches.classList.add('cmt-mice-stats-catches');
			catches.innerText = mouseTypeList[score][mouse].num_catches;

			// Add the image and name to the mouse element.
			mouseEl.appendChild(imageNameContainer);
			mouseEl.appendChild(catches);
			mouseBody.appendChild(mouseEl)

		}
				const toggleButton = document.createElement('button');
		toggleButton.textContent = 'Toggle Visibility';
		let visible = true;
		toggleButton.addEventListener('click', function() {
			const elements = document.querySelectorAll('.cmt-mice-stats-finished');
			// Toggle the visibility of the elements by changing their display property
			if (visible) {
			  elements.forEach(function(element) {
				element.style.display = 'none';
			  });
			  visible = false;
			} else {
			  elements.forEach(function(element) {
				element.style.display = 'block';
			  });
			  visible = true;
			}
		  });
		  
		// Append the button to the header element
		header.appendChild(toggleButton);
		// Add the header to the modal.
		modal.appendChild(header);
		modal.appendChild(mouseBody);

		// Add the modal to the wrapper.
		modalWrapper.appendChild(modal);
		// TODO: add it somewhere properly 
		// Add the wrapper to the body.
		target.appendChild(modalWrapper);

	}

    addStyles(`#cmt-mice-stats {
        position: absolute;
        top: 10px;
        left: -275px;
    }

	#cmt-mice-stats-finished {
        position: absolute;
        top: 10px;
        left: -275px;
    }

	#cmt-type-details {
        position: absolute;
        top: 10px;
        left: 27px;
    }

    .cmt-mice-stats-wrapper, .cmt-type-details-wrapper {
		z-index: 5000;
        position: fixed;
        width: 300px;
        background: #f6f3eb;
        border: 1px solid #534022;
        box-shadow: 1px 1px 1px 0px #9d917f;
    }
	.cmt-type-details-wrapper {
		height: 75%;
		overflow: auto;
	}

    .cmt-mice-stats-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #ceb7a6;
        background-color: #926944;
        padding: 10px;
        color: #f6f3eb;
    }

    .cmt-mice-stats-header h1 {
        color: #f6f3eb;
    }

    .cmt-mice-stats-close:hover {
        background-color: #ceb7a6;
        border-radius: 50%;
        cursor: pointer;
    }

    .cmt-mice-stats-body {
        max-height: 90vh;
        overflow-y: scroll;
        overflow-x: hidden;
    }

    .cmt-mice-stats-wrapper .cmt-mice-stats:nth-child(odd){
        background-color: #e8e3d7;
    }

    .cmt-mice-stats, .cmt-type-details{
        display: flex;
        justify-content: space-between;
        padding: 2px 0;
        align-items: center;
        padding: 10px 10px;
        color: #000;
    }
	.cmt-mice-stats-finished, .cmt-mice-stats-wrapper .cmt-mice-stats-finished:nth-child(odd) {
		color: #ffffff;
		background-color: black !important;
		display: flex;
        justify-content: space-between;
        padding: 2px 0;
        align-items: center;
        padding: 10px 10px;
	}

    .cmt-mice-stats:hover, .cmt-type-details:hover, .cmt-mice-stats-finished:hover
    .cmt-mice-stats-wrapper .cmt-mice-stats:nth-child(odd):hover, .cmt-mice-stats-wrapper .cmt-mice-stats-finished:nth-child(odd):hover {
        outline: 1px solid #ccc;
        background-color: #eee;
        text-decoration: none;
    }

    .cmt-mice-stats-image {
        position: relative;
        width: 40px;
        height: 40px;
        display: inline-block;
        vertical-align: middle;
        background-size: contain;
        background-repeat: no-repeat;
        border-radius: 2px;
        box-shadow: 1px 1px 1px #999;
    }

    .cmt-mice-stats-crown {
        position: absolute;
        right: -5px;
        bottom: -5px;
        width: 20px;
        height: 20px;
        background-repeat: no-repeat;
        background-position: 50% 50%;
        background-color: #fff;
        border: 1px solid #333;
        background-size: 80%;
        border-radius: 50%;
    }

    .cmt-mice-stats-name {
        display: inline-block;
        vertical-align: middle;
        padding-left: 10px;
    }

    .cmt-mice-stats-catches {
        padding-right: 5px;
    }`);

    addSubmenuItem({
        menu: 'mice',
        label: 'Mouse Catch Stats',
        icon: 'https://www.mousehuntgame.com/images/ui/hud/menu/prize_shoppe.png',
        callback: showModal
    });
	const mouseCats = [
        {type:"Arcane",
        mice: ["Abominable Snow","Admiral Cloudbeard","Arcane Summoner","Artillery Commander","Battering Ram","Big Bad Burroughs","Bionic","Black Widow","Breeze Borrower","Brown","Captain Croissant","Charming Chimer","Cloud Collector","Cloud Miner","Clumsy Chemist","Consumed Charm Tinkerer","Core Sample","Corrupt","Cowardly","Craggy Ore","Crimson Commander","Crown Collector","Cursed","Cursed Enchanter","Cursed Engineer","Cursed Librarian","Cursed Taskmaster","Cursed Thief","Cutthroat Cannoneer","Cutthroat Pirate","Cycloness","Dark Magi","Dawn Guardian","Daydreamer","Demolitions","Diamond","Dwarf","Empyrean Appraiser","Empyrean Geologist","Essence Collector","Essence Guardian","Ethereal Enchanter","Ethereal Engineer","Ethereal Librarian","Ethereal Thief","Extreme Everysports","Farmhand","Field","Flame Ordnance","Fluttering Flutist","Flying","Fog","Fortuitous Fool","Frosty Snow","Frozen","Gargoyle","Gate Guardian","Gold","Golem","Gorgon","Granite","Granny Spice","Grey","Heart of the Meteor","Homeopathic Apothecary","Hurdle","Hypnotized Gunslinger","Industrious Digger","Inferna, The Engulfed","Itty-Bitty Burroughs","Keeper","Keeper's Assistant","Kite Flyer","Lambent Crystal","Launchpad Labourer","Lich","Lightning Rod","Longtail","Magic","Mairitime Pirate","Meteorite Golem","Meteorite Mystic","Miner","Mole","Monster of the Meteor","Mountain","Mutated Brown","Mutated Grey","Mutated Mole","Mutated White","Nibbler","Night Watcher","Nightfire","Nightshade Flower Girl","Nightshade Maiden","Nugget","Old Spice Collector","Ooze","Paladin","Paragon of Arcane","Pebble","Peggy the Plunderer","Pugilist","Rainwater Purifier","Realm Ripper","Reaper","Relic Hunter","Richard the Rich","Rock Muncher","Sacred Shrine","Scarlet Revenger","Scavenger","Scruffy","Silvertail","Skeleton","Sky Dancer","Sky Glass Glazier","Sky Glass Sorcerer","Sky Glider","Sky Greaser","Sky Highborne","Skydiver","Slope Swimmer","Sludge Scientist","Sorcerer","Spectre","Speedy","Spice Farmer","Spice Finder","Spice Raider","Spice Reaper","Spice Seer","Spice Sovereign","Spider","Spore Salesman","Spotted","Spud","Squeaker Bot","Steel","Stone Cutter","Suave Pirate","Subterranean","Terror Knight","Tiny","Trampoline","Warden of Fog","Warden of Frost","Warden of Rain","Warden of Wind","Wave Racer","White","White Mage","Wight","Wind Warrior","Wind Watcher","Windy Farmer","Winter Games"]},
        {type:"Draconic",
        mice: ["Admiral Cloudbeard","Bearded Elder","Black Widow","Breeze Borrower","Brown","Bruticus, the Blazing","Burly Bruiser","Captain Croissant","Cinderstorm","Cloud Collector","Cloud Miner","Consumed Charm Tinkerer","Cork Defender","Corkataur","Corky, the Collector","Cowardly","Crimson Commander","Crown Collector","Cutthroat Cannoneer","Cutthroat Pirate","Daydreamer","Draconic Warden","Dragon","Dragonbreather","Dragoon","Dwarf","Emberstone Scaled","Empyrean Appraiser","Empyrean Geologist","Empyrean Javelineer","Extreme Everysports","Farmhand","Field","Flying","Fortuitous Fool","Ful'Mina, The Mountain Queen","Fuzzy Drake","Gargantuamouse","Grey","Homeopathic Apothecary","Horned Cork Hoarder","Hurdle","Ignatia","Kalor'ignis of the Geyser","Kite Flyer","Lancer Guard","Launchpad Labourer","Lightning Rod","Longtail","Magic","Mairitime Pirate","Mild Spicekin","Nibbler","Nightshade Flower Girl","Nightshade Maiden","Paragon of Dragons","Peggy the Plunderer","Pugilist","Pyrehyde","Rainwater Purifier","Rambunctious Rain Rumbler","Regal Spearman","Relic Hunter","Richard the Rich","Scarlet Revenger","Scruffy","Sizzle Pup","Sky Greaser","Skydiver","Smoldersnap","Speedy","Spore Salesman","Spotted","Spud","Steam Sailor","Steel","Stormsurge, the Vile Tempest","Suave Pirate","Thunder Strike","Thundering Watcher","Thunderlord","Tiny","Tiny Dragonfly","Trampoline","Vaporior","Violet Stormchild","Warden of Fog","Warden of Frost","Warden of Rain","Warden of Wind","Warming Wyvern","Wave Racer","Whelpling","White","Windy Farmer","Winter Games"]},
        {type:"Forgotten",
        mice: ["Abominable Snow","Acolyte","Admiral Cloudbeard","Ancient Scribe","Ash Golem","Automated Stone Sentry","Balack the Banished","Battle Cleric","Bionic","Bitter Grammarian","Bitter Root","Black Widow","Brothers Grimmaus","Brown","Captain Croissant","Cavern Crumbler","Chrono","Cloud Miner","Clumsy Chemist","Consumed Charm Tinkerer","Corridor Bruiser","Cowardly","Crag Elder","Craggy Ore","Crown Collector","Crystal Behemoth","Crystal Cave Worm","Crystal Controller","Crystal Golem","Crystal Lurker","Crystal Observer","Crystal Queen","Crystalback","Crystalline Slasher","Cumulost","Cutthroat Cannoneer","Cutthroat Pirate","Dark Templar","Daydreamer","Decrepit Tentacle Terror","Derr Lich","Diamond","Diamondhide","Dirt Thing","Drudge","Dwarf","Eclipse","Elub Lich","Empyrean Appraiser","Empyrean Geologist","Ethereal Guardian","Exo-Tech","Extreme Everysports","Farmhand","Fibbocchio","Field","Flamboyant Flautist","Floating Spore","Flying","Fog","Forgotten Elder","Fortuitous Fool","Frosty Snow","Frozen","Fungal Technomorph","Funglore","Gemorpher","Gemstone Worshipper","Gold","Granite","Greenbeard","Grey","Hans Cheesetian Squeakersen","Hired Eidolon","Humphrey Dumphrey","Huntereater","Hurdle","Ice Regent","Kite Flyer","Launchpad Labourer","Lightning Rod","Little Bo Squeak","Little Miss Fluffet","Longtail","Lost","Lost Legionnaire","Lumahead","Madame d'Ormouse","Magic","Mairitime Pirate","Manaforge Smith","Masked Pikeman","Matriarch Gander","Matron of Machinery","Matron of Wealth","Mimic","Mind Tearer","Molten Midas","Mouldy Mole","Mountain","Mush","Mush Monster","Mushroom Harvester","Mushroom Sprite","Mutated Brown","Mutated Grey","Mutated Mole","Mutated White","Mystic Guardian","Mystic Herald","Mystic Scholar","Mythweaver","Nerg Lich","Nibbler","Nightshade Fungalmancer","Nightshade Masquerade","Nightshade Nanny","Paladin Weapon Master","Paragon of Forgotten","Pebble","Peggy the Plunderer","Pinkielina","Princess and the Olive","Pugilist","Quillback","RR-8","Reanimated Carver","Relic Hunter","Retired Minotaur","Richard the Rich","Riptide","Sanguinarian","Scarlet Revenger","Scruffy","Shadow Stalker","Shattered Obsidian","Silvertail","Sir Fleekio","Sky Greaser","Skydiver","Slope Swimmer","Sludge Scientist","Solemn Soldier","Soul Binder","Speedy","Spheric Diviner","Spiked Burrower","Splintered Stone Sentry","Spore Muncher","Sporeticus","Spotted","Spry Sky Explorer","Spry Sky Seer","Spud","Squeaker Bot","Stalagmite","Steel","Stone Maiden","Suave Pirate","Summoning Scholar","Tech Golem","Tiny","Trampoline","Treasure Brawler","Warden of Fog","Warden of Frost","Warden of Rain","Warden of Wind","Wave Racer","White","Winter Games"]
		},
        {type:"Hydro",
        mice: ["Abominable Snow","Admiral Cloudbeard","Alchemist","Alnitak","Ancient of the Deep","Angelfish","Angler","Architeuthulhu of the Abyss","Bark","Barkshell","Barmy Gunner","Barnacle Beautician","Barracuda","Beachcomber","Betta","Bilged Boatswain","Biohazard","Bionic","Bitter Root","Black Widow","Bog Beast","Bottled","Bottom Feeder","Briegull","Brown","Bruticle","Buccaneer","Cabin Boy","Calalilly","Camoflower","Camofusion","Captain","Captain Croissant","Caravan Guard","Careless Catfish","Carmine the Apothecary","Carnivore","Champion","Chipper","City Noble","City Worker","Cloud Miner","Cloud Strider","Clownfish","Clumsy Carrier","Clumsy Chemist","Consumed Charm Tinkerer","Cook","Coral","Coral Cuddler","Coral Dragon","Coral Gardener","Coral Guard","Coral Harvester","Coral Queen","Corrupt Commodore","Covetous Coastguard","Cowardly","Crabolia","Craggy Ore","Crimson Commander","Crown Collector","Cute Cloud Conjurer","Cutthroat Cannoneer","Cutthroat Pirate","Cuttle","Dashing Buccaneer","Daydreamer","Deep","Deep Sea Diver","Dehydrated","Deranged Deckhand","Derpshark","Diamond","Dread Pirate M","Dwarf","Eel","Elder","Elite Guardian","Elub Chieftain","Empyrean Appraiser","Empyrean Geologist","Enginseer","Extreme Everysports","Farmhand","Field","Fiend","Floating Spore","Flying","Fog","Fortuitous Fool","Frostbite","Frostlance Guard","Frostwing Commander","Frosty Snow","Frozen","Fungal Spore","Funglore","Gelatinous Octahedron","General Drheller","Gold","Granite","Grey","Guppy","Hazmat","Heavy Blaster","Hurdle","Hydra","Hydrologist","Iceblade","Iceblock","Icebreaker","Icewing","Icicle","Incompetent Ice Climber","Inferno Mage","Jellyfish","Kite Flyer","Koimaid","Lab Technician","Lady Coldsnap","Launchpad Labourer","Leviathan","Lightning Rod","Living Ice","Living Salt","Longtail","Lord Splodington","Lumahead","Magic","Magmarage","Mairitime Pirate","Mammoth","Manatee","Melodramatic Minnow","Mermouse","Mermousette","Mershark","Mist Maker","Mlounder Flounder","Monster Tail","Mouldy Mole","Mountain","Mush","Mushroom Sprite","Mutant Mongrel","Mutant Ninja","Mutated Behemoth","Mutated Brown","Mutated Grey","Mutated Mole","Mutated Siblings","Mutated White","Mystic","Necromancer","Nefarious Nautilus","Nibbler","Nightshade Masquerade","Nimbomancer","Octomermaid","Old One","Outbreak Assassin","Over-Prepared","Oxygen Baron","Pack","Paragon of Water","Pearl","Pearl Diver","Pebble","Peggy the Plunderer","Penguin","Pinchy","Pirate","Pirate Anchor","Plague Hag","Polar Bear","Pompous Perch","Princess Fist","Protector","Puffer","Pugilist","Quillback","Relic Hunter","Richard the Rich","Saboteur","Salt Water Snapper","Saltwater Axolotl","Sand Dollar Diver","Sand Dollar Queen","Sand Sifter","Scarlet Revenger","School of Mish","Scout","Scrap Metal Monster","Scruffy","Seadragon","Serpent Monster","Shattered Carmine","Shelder","Shipwrecked","Shroom","Silth","Silvertail","Sinister Squid","Siren","Sky Greaser","Sky Surfer","Skydiver","Slimefist","Slope Swimmer","Sludge","Sludge Scientist","Sludge Soaker","Sludge Swimmer","Snow Bowler","Snow Slinger","Snow Sniper","Snow Soldier","Snowblind","Soothsayer","Spear Fisher","Speedy","Spiked Burrower","Spore","Spore Muncher","Sporeticus","Spotted","Spud","Squeaken","Squeaker Bot","Steel","Stickybomber","Stingray","Strawberry Hotcakes","Suave Pirate","Sunken Banshee","Sunken Citizen","Swabbie","Swamp Runner","Swashblade","Tackle Tracker","Tadpole","Taleweaver","Telekinetic Mutant","Tentacle","The Menace","Thirsty","Thistle","Thorn","Tiny","Toxic Warrior","Trampoline","Treasure Hoarder","Treasure Keeper","Tritus","Turret Guard","Twisted Carmine","Twisted Hotcakes","Twisted Lilly","Urchin King","Vanquisher","Vicious Vampire Squid","Warden of Fog","Warden of Frost","Warden of Rain","Warden of Wind","Water Nymph","Water Wielder","Wave Racer","White","Winter Games","Winter Mage","Wolfskie","Yeti"]
		},
        {type:"Law",
        mice: ["Abominable Snow","Admiral Cloudbeard","Agent M","Angry Train Staff","Aristo-Cat Burglar","Automorat","Bartender","Bionic","Black Powder Thief","Black Widow","Blacksmith","Bounty Hunter","Brown","Burglar","Cannonball","Captain Croissant","Cardshark","Circuit Judge","Cloud Miner","Clumsy Chemist","Coal Shoveller","Consumed Charm Tinkerer","Cowardly","Craggy Ore","Crate Camo","Croquet Crusher","Crown Collector","Cute Crate Carrier","Cutthroat Cannoneer","Cutthroat Pirate","Dangerous Duo","Daydreamer","Desert Architect","Desert Nomad","Desperado","Devious Gentleman","Diamond","Dwarf","Empyrean Appraiser","Empyrean Geologist","Extreme Everysports","Falling Carpet","Farmhand","Farrier","Field","Flying","Fog","Fortuitous Fool","Frosty Snow","Frozen","Fuel","Glass Blower","Gold","Granite","Grey","Hardworking Hauler","Hookshot","Hurdle","Kite Flyer","Lasso Cowgirl","Launchpad Labourer","Lawbender","Lightning Rod","Limestone Miner","Longtail","Lumberjack","Mage Weaver","Magic","Magmatic Crystal Thief","Magmatic Golem","Mairitime Pirate","Market Guard","Market Thief","Master Burglar","Meteorite Miner","Meteorite Mover","Meteorite Snacker","Mining Materials Manager","Mischievous Meteorite Miner","Mountain","Mouse With No Name","Mutated Brown","Mutated Grey","Mutated Mole","Mutated White","Mysterious Traveller","Nibbler","Outlaw","Paragon of the Lawless","Parlour Player","Passenger","Pebble","Peggy the Plunderer","Photographer","Pie Thief","Prospector","Pugilist","Pump Raider","Pyrite","Queen Quesada","Queso Extractor","Relic Hunter","Richard the Rich","Ruffian","Saloon Gal","Scarlet Revenger","Scruffy","Sharpshooter","Shopkeeper","Silvertail","Sky Greaser","Skydiver","Sleepy Merchant","Slope Swimmer","Sludge Scientist","Snake Charmer","Speedy","Spice Merchant","Spotted","Spud","Squeaker Bot","Stack of Thieves","Stagecoach Driver","Steel","Steel Horse Rider","Stoutgear","Stowaway","Stuffy Banker","Suave Pirate","Supply Hoarder","Tiny","Tiny Saboteur","Tonic Salesman","Train Conductor","Train Engineer","Trampoline","Travelling Barber","Tumbleweed","Undertaker","Upper Class Lady","Warden of Fog","Warden of Frost","Warden of Rain","Warden of Wind","Warehouse Manager","Wave Racer","White","Winter Games"]},
        {type:"Parental",
        mice: ["Aged Mouse"]},
        {type:"Physical",
        mice: ["Abominable Snow","Admiral Cloudbeard","Aged","Bandit","Big Bad Burroughs","Bionic","Black Widow","Blacksmith","Brown","Captain Croissant","Caravan Guard","Clockwork Samurai","Cloud Miner","Clumsy Chemist","Consumed Charm Tinkerer","Core Sample","Cowardly","Craggy Ore","Crimson Commander","Crimson Ranger","Crimson Titan","Crimson Watch","Crown Collector","Cutthroat Cannoneer","Cutthroat Pirate","Daydreamer","Demolitions","Derpicorn","Derr Chieftain","Desert Archer","Desert Architect","Desert Nomad","Desert Soldier","Diamond","Dwarf","Empyrean Appraiser","Empyrean Geologist","Escape Artist","Explorator","Extreme Everysports","Falling Carpet","Farmhand","Field","Flame Archer","Flame Warrior","Flying","Fog","Fortuitous Fool","Frosty Snow","Frozen","Gladiator","Glamorous Gladiator","Glass Blower","Gold","Granite","Grey","Ground Gavaleer","Grunt","Guardian","Hapless Marionette","Healer","Herc","Hurdle","Hydrophobe","Impersonator","Industrious Digger","Itty-Bitty Burroughs","Kite Flyer","Lambent Crystal","Launchpad Labourer","Lightning Rod","Limestone Miner","Lockpick","Longtail","Lumberjack","M400","Mage Weaver","Magic","Mairitime Pirate","Market Guard","Miner","Mintaka","Mole","Monster","Mountain","Mutated Brown","Mutated Grey","Mutated Mole","Mutated White","Nibbler","Nugget","Paragon of Strength","Pebble","Peggy the Plunderer","Pocketwatch","Puddlemancer","Pugilist","Puppet Master","Relic Hunter","Renegade","Richard the Rich","Rock Muncher","Rogue","Scarlet Revenger","Scribe","Scruffy","Seer","Sentinel","Silvertail","Sky Greaser","Sky Squire","Sky Swordsman","Skydiver","Slope Swimmer","Sludge Scientist","Snake Charmer","Sock Puppet Ghost","Speedy","Spellbinder","Spice Merchant","Spotted","Spring Familiar","Spud","Squeaker Bot","Stealth","Steam Grip","Steel","Stone Cutter","Suave Pirate","Subterranean","Tanglefoot","Theurgy Warden","Tiny","Toy Sylvan","Trailblazer","Trampoline","Vanguard","Vinetail","Warden of Fog","Warden of Frost","Warden of Rain","Warden of Wind","Warmonger","Wave Racer","White","Winter Games","Wordsmith","Wound Up White"]},
        {type:"Rift",
        mice: ["Abominable Snow","Admiral Cloudbeard","Agent M","Angry Train Staff","Aristo-Cat Burglar","Automorat","Bartender","Bionic","Black Powder Thief","Black Widow","Blacksmith","Bounty Hunter","Brown","Burglar","Cannonball","Captain Croissant","Cardshark","Circuit Judge","Cloud Miner","Clumsy Chemist","Coal Shoveller","Consumed Charm Tinkerer","Cowardly","Craggy Ore","Crate Camo","Croquet Crusher","Crown Collector","Cute Crate Carrier","Cutthroat Cannoneer","Cutthroat Pirate","Dangerous Duo","Daydreamer","Desert Architect","Desert Nomad","Desperado","Devious Gentleman","Diamond","Dwarf","Empyrean Appraiser","Empyrean Geologist","Extreme Everysports","Falling Carpet","Farmhand","Farrier","Field","Flying","Fog","Fortuitous Fool","Frosty Snow","Frozen","Fuel","Glass Blower","Gold","Granite","Grey","Hardworking Hauler","Hookshot","Hurdle","Kite Flyer","Lasso Cowgirl","Launchpad Labourer","Lawbender","Lightning Rod","Limestone Miner","Longtail","Lumberjack","Mage Weaver","Magic","Magmatic Crystal Thief","Magmatic Golem","Mairitime Pirate","Market Guard","Market Thief","Master Burglar","Meteorite Miner","Meteorite Mover","Meteorite Snacker","Mining Materials Manager","Mischievous Meteorite Miner","Mountain","Mouse With No Name","Mutated Brown","Mutated Grey","Mutated Mole","Mutated White","Mysterious Traveller","Nibbler","Outlaw","Paragon of the Lawless","Parlour Player","Passenger","Pebble","Peggy the Plunderer","Photographer","Pie Thief","Prospector","Pugilist","Pump Raider","Pyrite","Queen Quesada","Queso Extractor","Relic Hunter","Richard the Rich","Ruffian","Saloon Gal","Scarlet Revenger","Scruffy","Sharpshooter","Shopkeeper","Silvertail","Sky Greaser","Skydiver","Sleepy Merchant","Slope Swimmer","Sludge Scientist","Snake Charmer","Speedy","Spice Merchant","Spotted","Spud","Squeaker Bot","Stack of Thieves","Stagecoach Driver","Steel","Steel Horse Rider","Stoutgear","Stowaway","Stuffy Banker","Suave Pirate","Supply Hoarder","Tiny","Tiny Saboteur","Tonic Salesman","Train Conductor","Train Engineer","Trampoline","Travelling Barber","Tumbleweed","Undertaker","Upper Class Lady","Warden of Fog","Warden of Frost","Warden of Rain","Warden of Wind","Warehouse Manager","Wave Racer","White","Winter Games"]},
        {type:"Shadow",
        mice: ["Abominable Snow","Admiral Cloudbeard","Alpha Weremouse","Aquos","Astrological Astronomer","Bat","Battering Ram","Big Bad Burroughs","Bionic","Black Mage","Black Widow","Breeze Borrower","Brimstone","Brown","Captain Croissant","Chip Chiseler","Chitinous","Cloud Collector","Cloud Miner","Clumsy Chemist","Coffin Zombie","Consumed Charm Tinkerer","Core Sample","Cowardly","Craggy Ore","Crown Collector","Cutthroat Cannoneer","Cutthroat Pirate","Davy Jones","Daydreamer","Decrepit Tentacle Terror","Demolitions","Diamond","Dunehopper","Dwarf","Empyrean Appraiser","Empyrean Geologist","Enslaved Spirit","Extreme Everysports","Fall Familiar","Farmhand","Fetid Swamp","Field","Fiery Crusher","Flying","Fog","Fortuitous Fool","Frosty Snow","Frozen","Ghost","Giant Snail","Gluttonous Zombie","Goblin","Gold","Grampa Golem","Granite","Grey","Grubling","Grubling Herder","Harpy","Harvest Harrier","Harvester","Homeopathic Apothecary","Hurdle","Ignis","Industrious Digger","Itty-Bitty Burroughs","Jurassic","King Grub","King Scarab","Kite Flyer","Lambent Crystal","Launchpad Labourer","Lightning Rod","Longtail","Lycan","Magic","Magma Carrier","Mairitime Pirate","Miner","Mischievous Wereminer","Mole","Monsoon Maker","Monster","Mountain","Mousevina von Vermin","Mummy","Mutated Brown","Mutated Grey","Mutated Mole","Mutated White","Nachore Golem","Nachous, The Molten","Nibbler","Night Shift Materials Manager","Nightmancer","Nightshade Flower Girl","Nightshade Maiden","Nugget","Ore Chipper","Overcaster","Paragon of Shadow","Pebble","Peggy the Plunderer","Primal","Pugilist","Pumpkin Head","Pygmy Wrangler","Quesodillo","Rain Collector","Rain Summoner","Rain Wallower","Rainmancer","Rainwater Purifier","Ravenous Zombie","Relic Hunter","Reveling Lycanthrope","Richard the Rich","Riptide","Rock Muncher","Rubble Rouser","Rubble Rummager","Sand Colossus","Sand Pilgrim","Sarcophamouse","Scarab","Scarecrow","Scarlet Revenger","Scruffy","Serpentine","Shadow Sage","Silvertail","Sky Greaser","Skydiver","Slope Swimmer","Sludge Scientist","Speedy","Spiky Devil","Spore Salesman","Spotted","Spud","Squeaker Bot","Steel","Stone Cutter","Stonework Warrior","Stratocaster","Suave Pirate","Subterranean","Swarm of Pygmy Mice","Terra","Tidal Fisher","Tiny","Tiny Toppler","Trampoline","Troll","Twisted Fiend","Vampire","Warden of Fog","Warden of Frost","Warden of Rain","Warden of Wind","Wave Racer","Wealthy Werewarrior","Werehauler","Wereminer","Whirleygig","White","Windy Farmer","Winter Games","Zealous Academic","Zephyr","Zombie"]
		},
        {type:"Tactical",
        mice: ["Abominable Snow","Admiral Cloudbeard","Aether","Alnilam","Angry Aphid","Archer","Assassin","Bear","Beast Tamer","Berserker","Big Bad Burroughs","Bionic","Black Widow","Blacksmith","Bookborn","Brown","Captain Cloudkicker","Captain Croissant","Caravan Guard","Caretaker","Cavalier","Centaur","Chameleon","Cherry","Chess Master","Clockwork Samurai","Cloud Miner","Clumsy Chemist","Conjurer","Conqueror","Consumed Charm Tinkerer","Core Sample","Cowardly","Cowbell","Craggy Ore","Crazed Cultivator","Crimson Commander","Crown Collector","Curious Chemist","Cutthroat Cannoneer","Cutthroat Pirate","Cyclops","Dancer","Daydreamer","Defender","Demolitions","Desert Architect","Desert Nomad","Diamond","Dojo Sensei","Drummer","Dumpling Chef","Dwarf","Eagle Owl","Effervescent","Elven Princess","Empyrean Appraiser","Empyrean Geologist","Extreme Everysports","Fairy","Falling Carpet","Farmhand","Fencer","Fiddler","Field","Finder","Firebreather","Firefly","Flutterby","Flying","Fog","Fortuitous Fool","Foxy","Frog","Frosty Snow","Frozen","Glass Blower","Gold","Goldleaf","Grandfather","Granite","Grey","Grit Grifter","Guqin Player","Gyrologer","Hapless","Hapless Marionette","Hot Head","Hurdle","Hydra","Industrious Digger","Infiltrator","Itty-Bitty Burroughs","Kite Flyer","Knight","Kung Fu","Lambent Crystal","Land Loafer","Launchpad Labourer","Lightning Rod","Limestone Miner","Loathsome Locust","Longtail","Lumberjack","M400","Mage Weaver","Magic","Mairitime Pirate","Market Guard","Master of the Cheese Belt","Master of the Cheese Claw","Master of the Cheese Fang","Master of the Dojo","Mighty Mite","Miner","Mole","Monarch","Monk","Monstrous Midge","Moosker","Mountain","Mutated Brown","Mutated Grey","Mutated Mole","Mutated White","Mystic Bishop","Mystic King","Mystic Knight","Mystic Pawn","Mystic Queen","Mystic Rook","Narrator","Nerg Chieftain","Nibbler","Ninja","Nomad","Nugget","Page","Paragon of Tactics","Pathfinder","Pebble","Peggy the Plunderer","Phalanx","Pugilist","Puppet Master","Relic Hunter","Richard the Rich","Rock Muncher","Rocketeer","Root Rummager","Samurai","Sand Cavalry","Sandwing Cavalry","Scarlet Revenger","Scruffy","Seasoned Islandographer","Shaman","Silvertail","Sky Greaser","Skydiver","Slayer","Slope Swimmer","Sludge Scientist","Snake Charmer","Sock Puppet Ghost","Speedy","Spice Merchant","Spotted","Spud","Squeaker Bot","Steel","Stinger","Stone Cutter","Student of the Cheese Belt","Student of the Cheese Claw","Student of the Cheese Fang","Suave Pirate","Subterranean","Summer Mage","Sylvan","Technic Bishop","Technic King","Technic Knight","Technic Pawn","Technic Queen","Technic Rook","Tiger","Tiny","Tome Sprite","Toy Sylvan","Trampoline","Treant","Walker","Warden of Fog","Warden of Frost","Warden of Rain","Warden of Wind","Wave Racer","White","Wicked Witch of Whisker Woods","Wiggler","Wily Weevil","Winter Games","Worker","Worried Wayfinder","Wound Up White","Zurreal the Eternal"]
	}
    ]

})());

