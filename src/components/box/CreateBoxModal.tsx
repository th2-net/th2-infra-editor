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
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import { BoxEntity } from '../../models/Box';
import { useInput } from '../../hooks/useInput';
import Input from '../util/Input';

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
		label: 'Name',
		id: 'name',
		name: 'name',
		validate: (value: string) => !value.includes('_'),
	});

	const kindInput = useInput({
		initialValue: '',
		label: 'Kind',
		id: 'kind',
		name: 'kind',
	});

	const imageNameInput = useInput({
		initialValue: '',
		label: 'Image-name',
		id: 'image-name',
		name: 'image-name',
	});

	const imageVersionInput = useInput({
		initialValue: '',
		label: 'Image-version',
		id: 'image-version',
		name: 'image-version',
		validate: value => value.split('.').every(number => /^\d+$/.test(number)),
	});

	const nodePortInput = useInput({
		initialValue: '',
		label: 'Node-port',
		id: 'node-port',
		name: 'node-port',
		validate: (value: string) => /^\d+$/.test(value),
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
						<Input
							key={inputConfig.bind.id}
							inputConfig={inputConfig}
						/>
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
