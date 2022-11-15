// ==UserScript==
// @name         CMT Catch Stats
// @version      1.0.0
// @description
// @license      MIT
// @author
// @namespace
// @match        https://www.mousehuntgame.com/*
// @icon
// @grant        none
// @run-at       document-end
// ==/UserScript==

((function () {
	'use strict';

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
	//https://www.mousehuntgame.com/managers/ajax/mice/getstat.php
	//`sn=Hitgrab&hg_is_ajax=1&action=get_hunting_stats&uh=${user.unique_hash}`

	// const data = await doRequest(
	// 	'managers/ajax/mice/getstat.php',
	// 	{
	// 		sn: 'Hitgrab',
	// 		hg_is_ajax: 1,
	// 		action: 'get_hunting_stats',
	// 		uh: user.unique_hash
	// 		// action: 'get_environment',
	// 		// category: user.environment_type, // eslint-disable-line no-undef
	// 		// user_id: user.user_id, // eslint-disable-line no-undef
	// 		// display_mode: 'stats',
	// 		// view: 'ViewMouseListEnvironments',
	// 	}
	// );
	// console.log(data);
	// // Grab the data from the response.
	// const mouseData = data?.hunting_stats;
	// let fullData = {};
	// console.log(mouseData);
	// for (j in mouseData) {
	// 	fullData[mouseData[j]['name']] = mouseData[j]['num_catches']
	// }
	// console.log(fullData)
	// // Reorder by the num_catches key.
	// mouseData.sort((a, b) => {
	// 	return b.num_catches - a.num_catches;
	// });
	// console.log(mouseData);

	const getMouseStats = async () => {
		const data = await doRequest(
			'managers/ajax/mice/getstat.php',
			{
				sn: 'Hitgrab',
				hg_is_ajax: 1,
				action: 'get_hunting_stats',
				uh: user.unique_hash
				// action: 'get_environment',
				// category: user.environment_type, // eslint-disable-line no-undef
				// user_id: user.user_id, // eslint-disable-line no-undef
				// display_mode: 'stats',
				// view: 'ViewMouseListEnvironments',
			}
		);

		// Grab the data from the response.
		const mouseData = data?.mouse_list_category?.subgroups[ 0 ]?.mice;

		// Reorder by the num_catches key.
		mouseData.sort((a, b) => {
			return b.num_catches - a.num_catches;
		});

		// Return the data.
		return mouseData ? mouseData : [];
	};

	/**
	 * Build the markup for the stats.
	 *
	 * @param {Object} mouseData The mouse data.
	 *
	 * @return {Node} The node to append.
	 */
	const buildMouseMarkup = (mouseData) => {
		// Fallbacks for mouse data.
		const mouse = Object.assign({}, {
			name: '',
			type: '',
			image: '',
			crown: 'none',
			num_catches: 0,
		}, mouseData);

		const mouseEl = document.createElement('a');
		mouseEl.classList.add('cmt-mice-stats');

		mouseEl.title = mouse.name;
		mouseEl.addEventListener('click', () => {
			if ('undefined' !== hg?.views?.MouseView?.show) { // eslint-disable-line no-undef
				hg.views.MouseView.show(mouse.type); // eslint-disable-line no-undef
			}
		});

		// Create the image element.
		const image = document.createElement('div');
		image.classList.add('cmt-mice-stats-image');
		image.style.backgroundImage = `url('${ mouse.image }')`;

		// If the mouse has a crown, add it.
		if (mouse.crown && 'none' !== mouse.crown) {
			const crown = document.createElement('div');
			crown.classList.add('cmt-mice-stats-crown');
			crown.style.backgroundImage = `url('https://www.mousehuntgame.com/images/ui/crowns/crown_${ mouse.crown }.png')`;
			image.appendChild(crown);
		}

		// Create the name element.
		const name = document.createElement('div');
		name.classList.add('cmt-mice-stats-name');
		name.innerText = mouse.name;

		// Create a wrapper for the name and image.
		const imageNameContainer = document.createElement('div');
		imageNameContainer.appendChild(image);
		imageNameContainer.appendChild(name);

		// Create the catches element.
		const catches = document.createElement('div');
		catches.classList.add('cmt-mice-stats-catches');
		catches.innerText = mouse.num_catches;

		// Add the image and name to the mouse element.
		mouseEl.appendChild(imageNameContainer);
		mouseEl.appendChild(catches);

		// Return the mouse element.
		return mouseEl;
	};

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

		// Make the mouse stats table.
		const mouseBody = document.createElement('div');
		mouseBody.classList.add('cmt-mice-stats-body');

		// Get the mouse stats.
		const mouseStats = await getMouseStats();

		// Loop through the stats and add them to the modal.
		mouseStats.forEach((mouseData) => {
			mouseBody.appendChild(buildMouseMarkup(mouseData, mouseBody));
		});

		// Add the mouse stats to the modal.
		modal.appendChild(mouseBody);

		// Add the modal to the wrapper.
		modalWrapper.appendChild(modal);

		// Add the wrapper to the body.
		target.appendChild(modalWrapper);
	};

	addStyles(`#cmt-mice-stats {
		position: absolute;
		top: 10px;
		left: -275px;
	}
	.cmt-mice-stats-wrapper {
		position: fixed;
		width: 250px;
		background: #f6f3eb;
		border: 1px solid #534022;
		box-shadow: 1px 1px 1px 0px #9d917f;
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
	.cmt-mice-stats-wrapper .cmt-mice-stats:nth-child(odd) {
		background-color: #e8e3d7;
	}
	.cmt-mice-stats {
		display: flex;
		justify-content: space-between;
		padding: 2px 0;
		align-items: center;
		padding: 10px 10px;
		color: #000;
	}
	.cmt-mice-stats:hover,
	.cmt-mice-stats-wrapper .cmt-mice-stats:nth-child(odd):hover {
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
})());
