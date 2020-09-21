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
import { useInput } from '../../hooks/useInput';
import Input from '../util/Input';

interface PinsListProps {
	pins: Pin[];
	addPinToBox: (pin: Pin, boxName: string) => void;
	removePinFromBox: (pin: Pin, boxName: string) => void;
	boxName: string;
}

const PinsList = ({
	pins,
	addPinToBox,
	removePinFromBox,
	boxName,
}: PinsListProps) => {
	const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);

	const pinNameInput = useInput({
		initialValue: '',
		label: 'Name',
		id: 'pin-name',
		name: 'name',
	});

	const pinConnectionTypeInput = useInput({
		initialValue: '',
		label: 'Type',
		id: 'pin-type',
		name: 'type',
	});

	const addPin = () => {
		if (pinNameInput.value.trim() && pinConnectionTypeInput.value.trim()) {
			addPinToBox({
				name: pinNameInput.value,
				'connection-type': pinConnectionTypeInput.value,
				filters: [],
				attributes: [],
			}, boxName);
			setIsAddFormOpen(false);
			pinNameInput.setValue('');
			pinConnectionTypeInput.setValue('');
		}
	};

	const removePin = (pin: Pin) => {
		removePinFromBox(pin, boxName);
		setIsAddFormOpen(false);
	};

	return (
		<div className="box-settings__group">
			<label className="box-setting__label">Pins list</label>
			<div className='pins-list'>
				{
					pins.map(pin => (
						<div
							key={pin.name}
							className="pins-list__pin">
							<div className="pins-list__pin-info">
								<span className="pins-list__pin-info-title">Name: </span>
								<span className="pins-list__pin-info-value">{pin.name}</span>
							</div>
							<div className="pins-list__pin-info">
								<span className="pins-list__pin-info-title">Connection type: </span>
								<span className="pins-list__pin-info-value">{pin['connection-type']}</span>
							</div>
							<button
								onClick={() => removePin(pin)}
								className="pins-list__delete-button"/>
						</div>
					))
				}
				{
					isAddFormOpen
					&& (
						<div className="box-modal__add-form">
							{
								[pinNameInput, pinConnectionTypeInput].map(inputConfig =>
									<Input
										key={inputConfig.bind.id}
										inputConfig={inputConfig}
									/>)
							}
						</div>
					)
				}
				<div className="box-modal__buttons">
					{
						!isAddFormOpen
							? (<button
								onClick={() => setIsAddFormOpen(true)}
								className="box-modal__button">Add pin</button>)
							: (
								<>
									<button
										onClick={addPin}
										className="box-modal__button">Save</button>
									<button
										onClick={() => setIsAddFormOpen(false)}
										className="box-modal__button">Close</button>
								</>
							)
					}
				</div>
			</div>
		</div>
	);
};

export default PinsList;
