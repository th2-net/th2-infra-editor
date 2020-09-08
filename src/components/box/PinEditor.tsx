/* eslint-disable no-alert */
/** ****************************************************************************
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
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import { Pin } from '../../models/Box';
import { createBemElement } from '../../helpers/styleCreators';

interface PinEditor {
	pin: Pin;
	boxName: string;
	configuratePin: (pin: Pin, boxName: string) => void;
	onClose: () => void;
}

const PinEditor = ({
	pin,
	boxName,
	onClose,
	configuratePin,
}: PinEditor) => {
	const editorRef = React.useRef<HTMLDivElement>(null);

	const [pinsConfigValue, setPinsConfigValue] = React.useState(() => JSON.stringify(pin, null, 4));
	const [isValid, setIsValid] = React.useState(true);

	useOutsideClickListener(editorRef, onClose);

	const validateValue = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setIsValid(true);
		try {
			JSON.parse(e.target.value);
		} catch {
			setIsValid(false);
		}
		setPinsConfigValue(e.target.value);
	};

	const submit = () => {
		if (isValid) {
			configuratePin(JSON.parse(pinsConfigValue) as Pin, boxName);
		}
	};

	const editorClass = createBemElement(
		'pin-editor',
		'textarea',
		!isValid ? 'invalid' : '',
	);

	return (
		<div
			ref={editorRef}
			className="pin-editor">
			<h3 className='pin-editor__title'>Pin editor</h3>
			<textarea
				className={editorClass}
				value={pinsConfigValue}
				onChange={validateValue}/>
			<div className="pin-editor__buttons">
				<button
					onClick={() => submit()}
					className="pin-editor__button"
				>Submit</button>
				<button
					onClick={() => onClose()}
					className="pin-editor__button"
				>Close</button>
			</div>
		</div>
	);
};

export default PinEditor;
