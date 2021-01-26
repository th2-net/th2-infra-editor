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
import { useInput } from '../../hooks/useInput';
import { useKeyPress } from '../../hooks/useKeyPress';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import FormModal from './FormModal';

interface PromptModalProps {
	text: string;
	defaultValue?: string;
	onAnswer: (answer: string | null) => void;
}

const PromptModal = ({ text, defaultValue, onAnswer }: PromptModalProps) => {
	const modalRef = React.useRef<HTMLDivElement>(null);

	const isSubmited = React.useRef(false);

	useOutsideClickListener(modalRef, e => {
		if (
			!e
				.composedPath()
				.some(elem => elem instanceof HTMLElement && elem.className.includes('modal'))
		) {
			onAnswer(null);
		}
	});

	const isESCPressed = useKeyPress('Escape');
	const isEnterPressed = useKeyPress('Enter');

	React.useEffect(() => {
		if (isESCPressed) {
			onAnswer(null);
		}
		if (isEnterPressed) {
			submitHandler();
		}
	}, [isESCPressed, isEnterPressed]);

	const promptInput = useInput({
		initialValue: defaultValue,
		id: 'prompt-input',
		autoFocus: true,
	});

	const submitHandler = () => {
		if (promptInput.value.trim() && promptInput.isValid) {
			onAnswer(promptInput.value);
			isSubmited.current = true;
		}
	};

	return (
		<FormModal
			configList={[promptInput]}
			title={text}
			onClose={() => !isSubmited.current && onAnswer(null)}
			onSubmit={submitHandler}
		/>
	);
};

export default PromptModal;
