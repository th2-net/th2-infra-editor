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
import { useKeyPress } from '../../hooks/useKeyPress';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';

interface ConfirmModalProps {
	text: string;
	confirmButtonText?: string;
	onAnswer: (answer: boolean) => void;
}

const ConfirmModal = ({ text, confirmButtonText = 'Confirm', onAnswer }: ConfirmModalProps) => {
	const modalRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(modalRef, () => onAnswer(false));

	const isESCPressed = useKeyPress('Escape');

	React.useEffect(() => {
		if (isESCPressed) {
			onAnswer(false);
		}
	}, [isESCPressed]);

	return (
		<div ref={modalRef} className='modal' id='confirm-modal'>
			<div className='modal__header'>
				<h3 className='modal__header-title'>Confirm</h3>
				<button onClick={() => onAnswer(false)} className='modal__header-close-button'>
					<i className='modal__header-close-button-icon' />
				</button>
			</div>
			<div className='modal__content'>
				<p className='modal__paragraph'>{text}</p>
			</div>
			<div className='modal__buttons'>
				<button onClick={() => onAnswer(false)} className='modal__button close'>
					<i className='modal__button-icon' />
					Close
				</button>
				<button onClick={() => onAnswer(true)} className='modal__button submit'>
					<i className='modal__button-icon' />
					{confirmButtonText}
				</button>
			</div>
		</div>
	);
};

export default ConfirmModal;
