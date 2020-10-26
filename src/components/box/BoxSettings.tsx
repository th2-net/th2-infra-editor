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
import { BoxEntity, Pin } from '../../models/Box';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import PinsList from './PinsList';
import { DictionaryRelation } from '../../models/Dictionary';
import '../../styles/modal.scss';
import { createBemElement } from '../../helpers/styleCreators';
import BoxConfig from './BoxConfig';
import { useInput } from '../../hooks/useInput';
import { ModalPortal } from '../util/Portal';
import FormModal from '../util/FormModal';
import DictionaryList from './DictionaryList';

interface BoxSettingsProps {
	box: BoxEntity;
	configurateBox: (box: BoxEntity, dictionaryRelation: DictionaryRelation[]) => void;
	onClose: () => void;
	relatedDictionary: DictionaryRelation[];
	dictionaryNamesList: string[];
	setEditablePin: (pin: Pin) => void;
}

const BoxSettings = ({
	box,
	configurateBox,
	onClose,
	relatedDictionary,
	dictionaryNamesList,
	setEditablePin,
}: BoxSettingsProps) => {
	const modalRef = React.useRef<HTMLDivElement>(null);

	const [currentSection, setCurrentSection] = React.useState<'config' | 'pins' | 'dictionary'>('config');

	const [isAddPinFormOpen, setIsAddPinFormOpen] = React.useState(false);
	const [isAddDictionaryFormOpen, setIsAddDictionaryFormOpen] = React.useState(false);

	const imageNameInput = useInput({
		initialValue: box.spec['image-name'],
		label: 'image-name',
		name: 'image-name',
		id: 'image-name',
	});

	const imageVersionInput = useInput({
		initialValue: box.spec['image-version'],
		label: 'image-version',
		name: 'image-version',
		id: 'image-version',
	});

	const nodePortInput = useInput({
		initialValue: box.spec['node-port']?.toString() ?? '',
		label: 'node-port',
		name: 'node-port',
		id: 'node-port',
		validate: value => /^\d+$/.test(value),
	});

	const boxConfigInput = useInput({
		initialValue: box.spec['custom-config']
			? JSON.stringify(box.spec['custom-config'], null, 4)
			: '',
		label: 'Config',
		validate: value => {
			if (value.length === 0) return true;
			try {
				JSON.parse(value);
				return true;
			} catch {
				return false;
			}
		},
		name: 'config',
		id: 'config',
	});

	const pinNameConfigInput = useInput({
		initialValue: '',
		label: 'Name',
		id: 'pin-name',
	});

	const pinTypeConfigInput = useInput({
		initialValue: '',
		label: 'Connection type',
		id: 'pin-connection-type',
	});

	const relationNameInput = useInput({
		initialValue: '',
		label: 'Name',
		id: 'relation-name',
	});

	const dictionaryNameInput = useInput({
		initialValue: '',
		label: 'Dictionary name',
		id: 'dictionary-name',
		validate: value => dictionaryNamesList.includes(value),
		autocomplete: {
			datalistKey: 'dictionary-name__datalist-key',
			variants: dictionaryNamesList,
		},
	});

	const dictionaryTypeInput = useInput({
		initialValue: '',
		label: 'Dictionary type',
		id: 'dictionary-type',
	});

	const [relatedDictionaryList, setRelatedDictionaryList] = React.useState<DictionaryRelation[]>(relatedDictionary);

	const [pinList, setPinList] = React.useState(box.spec.pins);

	useOutsideClickListener(modalRef, (e: MouseEvent) => {
		if (
			!e.composedPath()
				.some(
					elem =>
						((elem as HTMLElement).className
							&& (elem as HTMLElement).className.includes)
							&& ((elem as HTMLElement).className.includes('modal')),
				)
		) {
			onClose();
		}
	});

	const configButtonClass = createBemElement(
		'modal',
		'content-switcher-button',
		currentSection === 'config' ? 'active' : 'null',
	);

	const pinsButtonClass = createBemElement(
		'modal',
		'content-switcher-button',
		'pins',
		currentSection === 'pins' ? 'active' : 'null',
	);

	const dictionaryButtonClass = createBemElement(
		'modal',
		'content-switcher-button',
		currentSection === 'dictionary' ? 'active' : 'null',
	);

	const addPinToList = () => {
		if (!pinList.find(pin => pin.name === pinNameConfigInput.value)) {
			setPinList([...pinList, {
				name: pinNameConfigInput.value,
				'connection-type': pinTypeConfigInput.value as 'mq' | 'grpc',
				attributes: [],
				filters: [],
			}]);
		} else {
			// eslint-disable-next-line no-alert
			window.alert(`Pin ${pinNameConfigInput.value} already exists`);
		}
	};

	const addDictionaryToList = () => {
		if (!relatedDictionaryList.find(dictionary => dictionary.name === relationNameInput.value)) {
			setRelatedDictionaryList([...relatedDictionaryList, {
				name: relationNameInput.value,
				box: box.name,
				dictionary: {
					name: dictionaryNameInput.value,
					type: dictionaryTypeInput.value,
				},
			}]);
		} else {
			// eslint-disable-next-line no-alert
			window.alert(`Dictionary ${relationNameInput.value} already exists`);
		}
	};

	const submit = () => {
		if ([imageNameInput, imageVersionInput, nodePortInput]
			.every(config => config.isValid && config.value.trim())
			&& boxConfigInput.isValid) {
			configurateBox({
				name: box.name,
				kind: box.kind,
				spec: {
					'image-name': imageNameInput.value,
					'image-version': imageVersionInput.value,
					'node-port': nodePortInput.value ? parseInt(nodePortInput.value) : undefined,
					'custom-config': boxConfigInput.value
						? JSON.parse(boxConfigInput.value)
						: undefined,
					pins: pinList,
					type: box.spec.type,
				},
			},
			relatedDictionaryList);
			onClose();
		}
	};

	return (
		<>
			<div ref={modalRef} className="modal">
				<div className="modal__header">
					<i className="modal__header-icon" />
					<h3 className="modal__header-title">
						{box.name}
					</h3>
					<button
						onClick={() => onClose()}
						className="modal__header-close-button">
						<i className="modal__header-close-button-icon" />
					</button>
				</div>
				<div className="modal__content">
					<div className="modal__content-switcher">
						<div
							onClick={() => setCurrentSection('config')}
							className={configButtonClass}>Box config</div>
						<div
							onClick={() => setCurrentSection('pins')}
							className={pinsButtonClass}>
							<i className="modal__content-switcher-button-icon" />
							{
								`${pinList.length} ${pinList.length === 1
									? 'pin'
									: 'pins'}`
							}
						</div>
						<div
							onClick={() => setCurrentSection('dictionary')}
							className={dictionaryButtonClass}>
							{
								`${relatedDictionaryList.length} ${pinList.length === 1
									? 'dictionary'
									: 'dictionaries'}`
							}
						</div>
					</div>
					{
						currentSection === 'config'
						&& <BoxConfig
							imageNameInputConfig={imageNameInput}
							imageVersionInputConfig={imageVersionInput}
							nodePortInputConfig={nodePortInput}
							boxConfigInput={boxConfigInput} />
					}
				</div>
				{
					currentSection === 'pins'
					&& <PinsList
						pins={pinList}
						removePinFromBox={deletedPin =>
							setPinList(pinList.filter(pin => pin.name !== deletedPin.name))}
						setEditablePin={pin => setEditablePin(pin)}/>
				}
				{
					currentSection === 'dictionary'
					&& <DictionaryList
						dictionaryRelations={relatedDictionaryList}
						removeDictionaryRelation={deletedRelation =>
							setRelatedDictionaryList(relatedDictionaryList
								.filter(relation => relation.name !== deletedRelation.name))} />
				}
				<div className="modal__buttons">
					{
						currentSection === 'pins'
						&& <button
							onClick={() => setIsAddPinFormOpen(true)}
							className="modal__button add">
							<i className="modal__button-icon" />
							Add pin
						</button>
					}
					{
						currentSection === 'dictionary'
						&& <button
							onClick={() => setIsAddDictionaryFormOpen(true)}
							className="modal__button add">
							<i className="modal__button-icon" />
							Add dictionary
						</button>
					}
					<button
						onClick={submit}
						className="modal__button submit">
						<i className="modal__button-icon" />
						Submit
					</button>
				</div>
			</div>
			<ModalPortal isOpen={isAddPinFormOpen}>
				<FormModal
					title={'Add pin'}
					inputConfigList={[pinNameConfigInput, pinTypeConfigInput]}
					onSubmit={addPinToList}
					onClose={() => setIsAddPinFormOpen(false)}
				/>
			</ModalPortal>
			<ModalPortal isOpen={isAddDictionaryFormOpen}>
				<FormModal
					title={'Add dictionary'}
					inputConfigList={[relationNameInput, dictionaryNameInput, dictionaryTypeInput]}
					onSubmit={addDictionaryToList}
					onClose={() => setIsAddDictionaryFormOpen(false)}
				/>
			</ModalPortal>
		</>
	);
};

export default BoxSettings;
