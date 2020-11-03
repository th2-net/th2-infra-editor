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
import { InputConfig } from '../../hooks/useInput';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import Input from './Input';

interface FormModalProps {
	title: string;
	inputConfigList: InputConfig[];
	onSubmit: () => void;
	onClose: () => void;
}

const FormModal = ({ title, inputConfigList, onSubmit, onClose }: FormModalProps) => {
	const modalRef = React.useRef<HTMLDivElement>(null);

	const submit = () => {
		if (inputConfigList.every(inputConfig => inputConfig.isValid && inputConfig.value.trim())) {
			onSubmit();
			onClose();
		}
	};

	useOutsideClickListener(modalRef, () => {
		onClose();
	});

	return (
		<div ref={modalRef} className='modal'>
			<div className='modal__header'>
				<h3 className='modal__header-title'>{title}</h3>
				<button onClick={() => onClose()} className='modal__header-close-button'>
					<i className='modal__header-close-button-icon' />
				</button>
			</div>
			<div className='modal__content'>
				{inputConfigList.map(inputConfig => (
					<Input key={inputConfig.bind.id} inputConfig={inputConfig} />
				))}
			</div>
			<div className='modal__buttons'>
				<button onClick={submit} className='modal__button submit'>
					<i className='modal__button-icon' />
					Submit
				</button>
			</div>
		</div>
	);
};

export default FormModal;
