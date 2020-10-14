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

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import ConfirmModal from '../components/util/ConfirmModal';

export default function openConfirmModal(text: string, confirmButtonText?: string) {
	return new Promise<boolean>((res, rej) => {
		const modalRoot = document.getElementById('modal-root');
		if (!modalRoot) rej();
		if (modalRoot) {
			const el = document.createElement('div');

			modalRoot.appendChild(el);

			ReactDOM.render(
				<ConfirmModal
					text={text}
					confirmButtonText={confirmButtonText}
					onAnswer={answer => {
						closeConfirmModal(el);
						res(answer);
					}} />,
				el,
			);
		}
	});
}

function closeConfirmModal(element: HTMLDivElement) {
	const modalRoot = document.getElementById('modal-root');

	if (modalRoot && element) {
		ReactDOM.unmountComponentAtNode(element);
		modalRoot.removeChild(element);
	}
}
