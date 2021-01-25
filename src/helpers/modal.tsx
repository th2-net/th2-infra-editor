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
import LinkCreateModal from '../components/box/LinkCreateModal';
import ConfirmModal from '../components/util/ConfirmModal';
import DecisionModal from '../components/util/DecisionModal';
import PromptModal from '../components/util/PromptModal';
import { ExtendedConnectionOwner } from '../models/Box';

export function openConfirmModal(text: string, confirmButtonText?: string) {
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
						ReactDOM.unmountComponentAtNode(el);
						modalRoot.removeChild(el);
						res(answer);
					}}
				/>,
				el,
			);
		}
	});
}

export function openPromptModal(text: string, defaultValue?: string) {
	return new Promise<string | null>((res, rej) => {
		const modalRoot = document.getElementById('modal-root');
		if (!modalRoot) rej();
		if (modalRoot) {
			const el = document.createElement('div');

			modalRoot.appendChild(el);

			ReactDOM.render(
				<PromptModal
					text={text}
					defaultValue={defaultValue}
					onAnswer={answer => {
						ReactDOM.unmountComponentAtNode(el);
						modalRoot.removeChild(el);
						res(answer);
					}}
				/>,
				el,
			);
		}
	});
}

export function openDecisionModal(
	text: string,
	options: {
		mainVariant?: {
			title: string;
			func: () => void;
		};
		variants: {
			title: string;
			func: () => void;
		}[];
	},
) {
	return new Promise<void>((res, rej) => {
		const modalRoot = document.getElementById('modal-root');
		if (!modalRoot) rej();
		if (modalRoot) {
			const el = document.createElement('div');

			modalRoot.appendChild(el);

			ReactDOM.render(
				<DecisionModal
					text={text}
					mainVariant={options.mainVariant}
					variants={options.variants}
					onClose={() => {
						ReactDOM.unmountComponentAtNode(el);
						modalRoot.removeChild(el);
						res();
					}}
				/>,
				el,
			);
		}
	});
}

export function openLinkCreateModal(
	defaultName: string,
	from: ExtendedConnectionOwner,
	to: ExtendedConnectionOwner,
	extended: boolean,
) {
	return new Promise<void>((res, rej) => {
		const modalRoot = document.getElementById('modal-root');
		if (!modalRoot) rej();
		if (modalRoot) {
			const el = document.createElement('div');

			modalRoot.appendChild(el);

			const closeModal = () => {
				ReactDOM.unmountComponentAtNode(el);
				res();
			};

			ReactDOM.render(
				<LinkCreateModal
					defaultName={defaultName}
					from={from}
					to={to}
					extended={extended}
					close={closeModal}
				/>,
				el,
			);
		}
	});
}
