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
import { createStyleSelector } from '../../helpers/styleCreators';
import '../../styles/modal.scss';
import { useCheckbox } from '../../hooks/useCheckbox';
import Checkbox from '../util/Checkbox';

interface CreateBoxModalProps {
	createBox: (box: BoxEntity) => void;
	typeVariants: string[];
	onClose: () => void;
}

const CreateBoxModal = ({ createBox, typeVariants, onClose }: CreateBoxModalProps) => {
	const modalRef = React.useRef<HTMLDivElement>(null);

	const nameInput = useInput({
		label: 'Name',
		id: 'name',
		name: 'name',
		validate: name => !name.includes('_') && name.trim().length > 0,
	});

	const typeInput = useInput({
		label: 'Type',
		id: 'type',
		name: 'type',
		autocomplete: {
			variants: typeVariants,
			datalistKey: 'create-box-modal__box-type',
		},
	});

	const imageNameInput = useInput({
		label: 'Image-name',
		id: 'image-name',
		name: 'image-name',
		validate: imageName => imageName.trim().length > 0,
	});

	const imageVersionInput = useInput({
		label: 'Image-version',
		id: 'image-version',
		name: 'image-version',
		validate: imageVersion => imageVersion.trim().length > 0,
	});

	const nodePortInput = useInput({
		label: 'Node-port',
		id: 'node-port',
		name: 'node-port',
		validate: (value: string) =>
			value.trim().length > 0 ? /^\d+$/.test(value) && parseInt(value) <= 65535 : true,
	});

	const serviceEnabledCheckbox = useCheckbox({
		initialState: false,
		id: 'Service-enabled',
		name: 'service-enabled',
		label: 'service-enabled',
	});

	useOutsideClickListener(modalRef, () => {
		onClose();
	});

	const inputs = [nameInput, typeInput, imageNameInput, imageVersionInput, nodePortInput];

	const createNewBox = () => {
		if (inputs.every(inputConfig => inputConfig.isValid)) {
			const inputValues = inputs.map(inputConfig => inputConfig.value.trim());
			const [name, type, imageName, imageVersion, nodePortString] = inputValues;
			let nodePort;
			if (nodePortString) {
				nodePort = parseInt(nodePortString);
			}

			const spec: BoxEntity['spec'] = {
				pins: [],
				'image-name': imageName,
				'image-version': imageVersion,
				type,
				'extended-settings': {
					service: {
						enabled: true,
					},
				},
			};

			if (typeof nodePort === 'number') spec['node-port'] = nodePort;
			createBox({
				name,
				kind: 'Th2Box',
				spec,
			});
			onClose();
		} else {
			alert('Invalid box info');
		}
	};

	const submitButtonClassName = createStyleSelector(
		'modal__button',
		'submit',
		inputs.every(input => input.isValid) ? '' : 'disable',
	);

	return (
		<div ref={modalRef} className='modal'>
			<div className='modal__header'>
				<i className='modal__header-icon' />
				<h3 className='modal__header-title'>Create box</h3>
				<button onClick={() => onClose()} className='modal__header-close-button'>
					<i className='modal__header-close-button-icon' />
				</button>
			</div>
			<div className='modal__content'>
				{inputs.map(inputConfig => (
					<Input key={inputConfig.bind.id} inputConfig={inputConfig} />
				))}
				<Checkbox checkboxConfig={serviceEnabledCheckbox} />
			</div>
			<div className='modal__buttons'>
				<button onClick={createNewBox} className={submitButtonClassName}>
					<i className='modal__button-icon' />
					Submit
				</button>
			</div>
		</div>
	);
};

export default CreateBoxModal;
