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

import React, { useImperativeHandle } from 'react';
import { observer } from 'mobx-react-lite';
import { createBemElement } from '../../helpers/styleCreators';
import { BoxEntity } from '../../models/Box';
import useStore from '../../hooks/useStore';
import { ModalPortal } from '../util/Portal';
import BoxSettings from './BoxSettings';
import useWindowSize from '../../hooks/useWindowSize';
import '../../styles/box.scss';

interface Props {
	box: BoxEntity;
	groupsTopOffset?: number;
	titleHeight?: number;
	connectionDirection?: 'left' | 'right';
}

export interface BoxMethods {
	updateCoords: () => void;
	kind: string;
}

const Box = ({
	box,
	groupsTopOffset,
	titleHeight,
	connectionDirection,
}: Props, ref: React.Ref<BoxMethods>) => {
	const { rootStore } = useStore();
	const [isModalOpen, setIsModalOpen] = React.useState(false);

	const boxRef = React.useRef<HTMLDivElement>(null);

	const windowSize = useWindowSize();

	React.useEffect(() => {
		sendCoords();
	}, [windowSize]);

	useImperativeHandle(
		ref,
		() => ({
			updateCoords: () => {
				sendCoords();
			},
			kind: box.kind,
		}), [groupsTopOffset],
	);

	const sendCoords = () => {
		if (groupsTopOffset && titleHeight) {
			const clientRect = boxRef.current?.getBoundingClientRect();
			if (clientRect) {
				const leftConnection = {
					left: clientRect?.left,
					top: clientRect?.top + (clientRect?.height / 2)
					- groupsTopOffset - titleHeight,
				};
				const rightConnection = {
					left: clientRect?.left + clientRect.width,
					top: clientRect?.top + (clientRect?.height / 2)
					- groupsTopOffset - titleHeight,
				};
				rootStore.addCoords(box, {
					leftConnection,
					rightConnection,
				});
			}
		}
	};

	const settingsIconClassName = createBemElement(
		'box',
		'settings-icon',
		isModalOpen ? 'active' : null,
	);

	const boxConectionClassName = createBemElement(
		'box',
		'connection',
		connectionDirection || null,
	);

	const deleteBoxHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.stopPropagation();
		if (window.confirm(`Are you sure you want to delete box "${box.name}"`)) {
			rootStore.deleteBox(box.name);
		}
	};

	const onSelectBox = () => {
		rootStore.setSelectedBox(rootStore.selectedBox === box ? null : box);
	};

	return (
		<div
			ref={boxRef}
			className="box"
			onClick={onSelectBox}>
			<span className="box__title">
				{box.name}
			</span>
			<div className="box__buttons-wrapper">
				<button
					className="box__button"
					onClick={e => {
						e.stopPropagation();
						setIsModalOpen(!isModalOpen);
					}}>
					<i className={settingsIconClassName}/>
				</button>
				<button
					className="box__button"
					onClick={deleteBoxHandler}>
					<i className='box__remove-icon'/>
				</button>
			</div>
			{
				connectionDirection
				&& 	<div
					className={boxConectionClassName}
					onClick={e => {
						e.stopPropagation();
						rootStore.setConnection(box);
					}}
				/>
			}
			<ModalPortal isOpen={isModalOpen}>
				<BoxSettings
					box={box}
					onParamValueChange={rootStore.setBoxParamValue}
					onClose={() => setIsModalOpen(false)}
					addDictionaryRelation={rootStore.addDictionaryRelation}
					changeCustomConfig={rootStore.changeCustomConfig}
					deleteParam={rootStore.deleteParam}
					setImageInfo={rootStore.setImageInfo}
				/>
			</ModalPortal>
		</div>
	);
};

export default observer(Box, { forwardRef: true });
