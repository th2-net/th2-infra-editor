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
import { observer } from 'mobx-react-lite';
import useHistoryStore from '../../hooks/useHistoryStore';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import ChangeLogBoxItem from './ChangeLogBoxItem';
import ChangeLogLinkItem from './ChangeLogLinkItem';
import ChangeLogDictionaryItem from './ChangeLogDictionaryItem';

interface ChangeLogModalProps {
	top?: number;
	left?: number;
	width?: number;
	onClose: () => void;
}

const ChangeLogModal = ({
	top,
	left,
	width,
	onClose,
}: ChangeLogModalProps) => {
	const historyStore = useHistoryStore();

	const modalRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(modalRef, (e: MouseEvent) => {
		if (
			!e.composedPath().some(
				elem =>
					(elem as HTMLElement).className
					&& (elem as HTMLElement).className.includes
					&& (elem as HTMLElement).className.includes('header__button changes active'),
			)) {
			onClose();
		}
	});

	return (
		<div
			ref={modalRef}
			style={{
				left: `${left ?? 0}px`,
				top: `${top ?? 0}px`,
				width: `${width ?? 0}px`,
			}}
			className="modal header__modal"
		>
			{
				historyStore.history.length > 0
					? <div className="modal__elements-list long">
						{historyStore.history.map((snapshot, index) => {
							switch (snapshot.type) {
								case 'box': return <ChangeLogBoxItem
									key={index} snapshot={snapshot} />;
								case 'link': return <ChangeLogLinkItem
									key={index} snapshot={snapshot} />;
								case 'dictionary': return <ChangeLogDictionaryItem
									key={index} snapshot={snapshot} />;
								default: return <></>;
							}
						})}
					</div>
					: <div className="modal__empty">
						Change log is empty
					</div>
			}
		</div>
	);
};

export default observer(ChangeLogModal);
