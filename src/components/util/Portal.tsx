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

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useKeyPress } from '../../hooks/useKeyPress';

const modalRoot = document.getElementById('modal-root');

interface Props {
	children: React.ReactNode;
}

export const Portal = ({ children }: Props) => {
	const el = useRef(document.createElement('div'));

	useEffect(() => {
		modalRoot?.appendChild(el.current);
		return () => {
			modalRoot?.removeChild(el.current);
		};
	}, []);

	return createPortal(children, el.current);
};

interface ModalPortalProps {
	closeDelay?: number;
	children: React.ReactNode;
	isOpen: boolean;
	closeModal?: () => void;
}

export const ModalPortal = ({ closeDelay = 0, children, isOpen, closeModal }: ModalPortalProps) => {
	const [isShown, setIsShown] = React.useState(false);

	const isEscPressed = useKeyPress('Escape');

	React.useEffect(() => {
		if (isEscPressed && closeModal) {
			closeModal();
		}
	}, [isEscPressed]);

	React.useEffect(() => {
		if (!isOpen && closeDelay !== 0) {
			setTimeout(() => {
				setIsShown(isOpen);
			}, closeDelay);
			return;
		}

		setIsShown(isOpen);
	}, [isOpen]);

	return isShown ? <Portal>{children}</Portal> : null;
};
