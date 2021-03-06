/** *****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import React from 'react';
import { createBemElement } from '../../helpers/styleCreators';

interface ContextMenu {
	state: 'left' | 'right' | 'closed';
	togglePinConfigurator: () => void;
	closeContextMenu: () => void;
	deletePinConnections: () => void;
}

const ContextMenu = ({
	state,
	togglePinConfigurator,
	closeContextMenu,
	deletePinConnections,
}: ContextMenu) => {
	const contextMenuClass = createBemElement('pin', 'context-menu', state);

	return (
		<div className={contextMenuClass}>
			<button
				onClick={() => {
					togglePinConfigurator();
					closeContextMenu();
				}}
				className='pin__menu-button'>
				<i className='pin__menu-button-icon edit' />
			</button>
			<div className='pin__menu-separator' />
			<button
				onClick={() => {
					deletePinConnections();
					closeContextMenu();
				}}
				className='pin__menu-button'>
				<i className='pin__menu-button-icon delete' />
			</button>
		</div>
	);
};

export default ContextMenu;
