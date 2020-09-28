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
import { BoxEntity, DictionaryRelation } from '../../models/Box';
import BoxImageInfo from './BoxImageInfo';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import BoxDictionaryConfigurator from './BoxDictionaryConfigurator';
import ConfigEditor from './ConfigEditor';
import PinsList from './PinsList';

interface BoxSettingsProps {
	box: BoxEntity;
	configurateBox: (box: BoxEntity) => void;
	onClose: () => void;
	addDictionaryRelation: (dictionaryRelation: DictionaryRelation) => void;
}

const BoxSettings = ({
	box,
	configurateBox,
	onClose,
	addDictionaryRelation,
}: BoxSettingsProps) => {
	const modalRef = React.useRef<HTMLDivElement>(null);

	const [showDictionaryConfigurator, isShowAddForm] = React.useState(false);

	const [isBoxModified, setIsBoxModified] = React.useState(false);

	const [imageName, setImageName] = React.useState<{
		value: string;
		isValid: boolean;
	}>({
		value: box.spec['image-name'],
		isValid: true,
	});

	const [imageVersion, setImageVersion] = React.useState<{
		value: string;
		isValid: boolean;
	}>({
		value: box.spec['image-version'],
		isValid: true,
	});

	const [nodePort, setNodePort] = React.useState<{
		value: string;
		isValid: boolean;
	}>({
		value: box.spec['node-port'] ? box.spec['node-port'].toString() : '',
		isValid: true,
	});

	const [customConfig, setCustomConfig] = React.useState<{
		value: {
			[prop: string]: string;
		};
		isValid: boolean;
	}>({
		value: box.spec['custom-config'] ?? {},
		isValid: true,
	});

	const [pinList, setPinList] = React.useState(box.spec.pins);

	const saveChanges = () => {
		if (
			imageName.isValid
			&& imageVersion.isValid
			&& nodePort.isValid
			&& customConfig.isValid
			&& isBoxModified
		) {
			configurateBox({
				name: box.name,
				kind: box.kind,
				spec: {
					'image-name': imageName.value,
					'image-version': imageVersion.value,
					'node-port': nodePort.value ? parseInt(nodePort.value) : undefined,
					'custom-config': customConfig.value,
					pins: pinList,
				},
			});
			onClose();
		}
	};

	useOutsideClickListener(modalRef, () => {
		onClose();
	});

	return (
		<div ref={modalRef} className="box-modal">
			<h3 className="box-modal__name">
				{box.name}
			</h3>
			<div className="box-modal__box-settings">
				<div className="box-modal__image-info">
					<BoxImageInfo
						spec={{
							imageName: imageName.value,
							imageVersion: imageVersion.value,
							nodePort: nodePort.value,
						}}
						setImageName={value => {
							setImageName(value);
							setIsBoxModified(true);
						}}
						setImageVersion={value => {
							setImageVersion(value);
							setIsBoxModified(true);
						}}
						setNodePort={value => {
							setNodePort(value);
							setIsBoxModified(true);
						}}
					/>
					<ConfigEditor
						config={customConfig.value}
						setCustomConfig={value => {
							setCustomConfig(value);
							setIsBoxModified(true);
						}}
					/>
					<PinsList
						pins={pinList}
						addPinToBox={pin => {
							setPinList([...pinList, pin]);
							setIsBoxModified(true);
						}}
						removePinFromBox={removablePin => {
							setPinList(pinList
								.filter(pin => pin.name !== removablePin.name));
							setIsBoxModified(true);
						}}
					/>
				</div>
				<div className="box-modal__props-list">
					{
						showDictionaryConfigurator
						&& <BoxDictionaryConfigurator
							addDictionaryRelation={addDictionaryRelation}
							boxName={box.name}
							closeAddForm={() => isShowAddForm(false)}/>
					}
				</div>
			</div>
			<div className="box-modal__buttons">
				<button
					onClick={saveChanges}
					className='box-modal__button'>
						Save changes
				</button>
				{
					!showDictionaryConfigurator
					&& <button
						className="box-modal__button"
						onClick={() => isShowAddForm(true)}>
						Add Dictionary
					</button>
				}
				<button
					onClick={onClose}
					className="box-modal__button">
					Close
				</button>
			</div>
		</div>
	);
};

export default BoxSettings;
