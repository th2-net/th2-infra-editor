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
 *  limitations under the License.
 ***************************************************************************** */

import React from 'react';
import { Pin } from '../../models/Box';

interface PinsListProps {
	pins: Pin[];
	removePinFromBox: (pin: Pin) => void;
	setEditablePin: (pin: Pin) => void;
}

const PinsList = ({ pins, removePinFromBox, setEditablePin }: PinsListProps) => (
	<div className='modal__elements-list'>
		{pins.length > 0 ? (
			pins.map(pin => (
				<div key={pin.name} className='modal__elements-item'>
					<div className='modal__elements-item-info'>
						<span className='modal__elements-item-info-name'>{pin.name}</span>
					</div>
					<div className='modal__elements-item-buttons-wrapper'>
						<button
							onClick={() => {
								setEditablePin(pin);
							}}
							className='modal__elements-item-button edit'>
							<i className='modal__elements-item-button-icon' />
						</button>
						<button
							onClick={() => removePinFromBox(pin)}
							className='modal__elements-item-button delete'>
							<i className='modal__elements-item-button-icon' />
						</button>
					</div>
				</div>
			))
		) : (
			<div className='modal__empty'>Pins list is empty</div>
		)}
	</div>
);

export default PinsList;
