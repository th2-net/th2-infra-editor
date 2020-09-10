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
import { createBemElement } from '../../helpers/styleCreators';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import { BoxEntity } from '../../models/Box';
import { useInput } from '../../hooks/useInput';

interface CreateBoxModalProps {
	createNewBox: (box: BoxEntity) => void;
	onClose: () => void;
}

const CreateBoxModal = ({
	createNewBox,
	onClose,
}: CreateBoxModalProps) => {
	const modalRef = React.useRef<HTMLDivElement>(null);

	const nameInput = useInput({
		initialValue: '',
		validate: (value: string) => !value.includes('_'),
		id: 'Name',
		name: 'Name',
	});

	const kindInput = useInput({ initialValue: '', id: 'Kind', name: 'Kind' });

	const imageNameInput = useInput({ initialValue: '', id: 'Image-name', name: 'Image-name' });

	const imageVersionInput = useInput({
		initialValue: '',
		validate: value => value.split('.').every(number => /^\d+$/.test(number)),
		id: 'Image-version',
		name: 'Image-version',
	});

	const nodePortInput = useInput({
		initialValue: '',
		validate: (value: string) => /^\d+$/.test(value),
		id: 'Node-port',
		name: 'Node-port',
	});

	useOutsideClickListener(modalRef, () => {
		onClose();
	});

	const inputs = [nameInput, kindInput, imageNameInput, imageVersionInput, nodePortInput];

	const createBox = () => {
		if (inputs.every(inputConfig => inputConfig.isValid)) {
			const inputValues = inputs.map(inputConfig => inputConfig.value.trim());
			const [
				name, kind, imageName, imageVersion, nodePortString,
			] = inputValues;
			let nodePort;
			if (nodePortString) {
				nodePort = parseInt(nodePortString);
			}

			if (inputValues.every(Boolean) && typeof nodePort === 'number' && nodePort <= 65535) {
				createNewBox({
					name,
					kind,
					spec: {
						pins: [],
						'image-name': imageName,
						'image-version': imageVersion,
						'node-port': nodePort,
					},
				});
				onClose();
			}
		} else {
			// eslint-disable-next-line no-alert
			alert('Invalid box info');
		}
	};

	return (
		<div
			ref={modalRef}
			className='create-box-modal'>
			<h3 className='create-box-modal__title'>Create new box</h3>
			<div className="create-box-modal__info-list">
				{
					inputs.map(inputConfig => (
						<div className="box-settings__group" key={inputConfig.bind.id}>
							<label
								htmlFor={inputConfig.bind.id}
								className="box-settings__label">
								{inputConfig.bind.name}
							</label>
							<input
								type="text"
								className={createBemElement(
									'box-settings',
									'input',
									!inputConfig.isValid && inputConfig.isDirty ? 'invalid' : '',
								)}
								{...inputConfig.bind}
							/>
						</div>
					))
				}
			</div>
			<div className="box-modal__buttons">
				<button onClick={createBox} className="box-modal__button">
					Submit
				</button>
				<button onClick={onClose} className="box-modal__button">
					Close
				</button>
			</div>
		</div>
	);
};

export default CreateBoxModal;
