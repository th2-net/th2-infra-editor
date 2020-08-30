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

interface CreateBoxModalInfoProps {
	info: {
		name: string;
		value: string;
		validationFunc: (value: string) => boolean;
		isValid: boolean;
	};
	setValue: (value: string, infoName: string) => void;
	setIsValid: (isValid: boolean, infoName: string) => void;
}

const CreateBoxModalInfo = ({
	info,
	setValue,
	setIsValid,
}: CreateBoxModalInfoProps) => {
	const inputClass = createBemElement(
		'box-settings',
		'input',
		!info.isValid ? 'invalid' : '',
	);

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!info.validationFunc(e.target.value)) {
			setIsValid(false, info.name);
		} else {
			setIsValid(true, info.name);
		}
		setValue(e.target.value, info.name);
	};

	return (
		<div
			key={info.name}
			className="box-settings__group">
			<label
				htmlFor={info.name}
				className="box-settings__label">
				{info.name}
			</label>
			<input
				id={info.name}
				type="text"
				className={inputClass}
				value={info.value}
				onChange={onChange}
			/>
		</div>
	);
};

interface CreateBoxModalProps {
	createNewBox: (box: BoxEntity) => void;
	onClose: () => void;
}

const CreateBoxModal = ({
	createNewBox,
	onClose,
}: CreateBoxModalProps) => {
	const modalRef = React.useRef<HTMLDivElement>(null);

	const [boxInfo, setBoxInfo] = React.useState([
		{
			name: 'Name',
			value: '',
			validationFunc: (value: string) => !value.includes('_'),
			isValid: true,
		},
		{
			name: 'Kind',
			value: '',
			validationFunc: () => true,
			isValid: true,
		},
		{
			name: 'Image-name',
			value: '',
			validationFunc: () => true,
			isValid: true,
		},
		{
			name: 'Image-version',
			value: '',
			validationFunc: (value: string) => value.split('.').every(number => /^\d+$/.test(number)),
			isValid: true,
		},
		{
			name: 'Node-port',
			value: '',
			validationFunc: (value: string) => /^\d+$/.test(value),
			isValid: true,
		},
	]);

	useOutsideClickListener(modalRef, () => {
		onClose();
	});

	const setValue = (value: string, infoName: string) => {
		const infoIndex = boxInfo.findIndex(info => info.name === infoName);
		const newInfo = [...boxInfo];
		newInfo[infoIndex].value = value;
		setBoxInfo(newInfo);
	};

	const setIsValid = (isValid: boolean, infoName: string) => {
		const infoIndex = boxInfo.findIndex(info => info.name === infoName);
		const newInfo = [...boxInfo];
		newInfo[infoIndex].isValid = isValid;
		setBoxInfo(newInfo);
	};

	const submit = () => {
		if (boxInfo.every(info => info.isValid)) {
			const name = boxInfo.find(info => info.name === 'Name')?.value;
			const kind = boxInfo.find(info => info.name === 'Kind')?.value;
			const imageName = boxInfo.find(info => info.name === 'Image-name')?.value;
			const imageVersion = boxInfo.find(info => info.name === 'Image-version')?.value;
			const nodePortString = boxInfo.find(info => info.name === 'Node-port')?.value;
			let nodePort;
			if (nodePortString) {
				nodePort = parseInt(nodePortString);
			}

			if (name?.trim()
				&& kind?.trim()
				&& imageName?.trim()
				&& imageVersion?.trim()
				&& nodePort
				&& nodePort <= 65535) {
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
					boxInfo.map(info => (
						<CreateBoxModalInfo
							key={info.name}
							info={info}
							setValue={setValue}
							setIsValid={setIsValid}
						/>
					))
				}
			</div>
			<div className="box-modal__buttons">
				<button
					onClick={() => submit()}
					className="box-modal__button"
				>Submit</button>
				<button
					onClick={() => onClose()}
					className="box-modal__button"
				>Close</button>
			</div>
		</div>
	);
};

export default CreateBoxModal;
