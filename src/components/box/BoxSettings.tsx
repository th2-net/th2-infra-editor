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
import { observer } from 'mobx-react-lite';
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
import useSchemasStore from '../../hooks/useSchemasStore';
import { isEqual } from '../../helpers/object';
import { openDecisionModal } from '../../helpers/modal';

interface BoxSettingsProps {
	box: BoxEntity;
	onClose: () => void;
	setEditablePin: (pin: Pin) => void;
}

const BoxSettings = ({ box, onClose, setEditablePin }: BoxSettingsProps) => {
	const schemasStore = useSchemasStore();

	const modalRef = React.useRef<HTMLDivElement>(null);

	const [editableBox, setEditableBox] = React.useState<BoxEntity>(box);
	const [isUpdated, setIsUpdated] = React.useState(false);
	const [currentSection, setCurrentSection] = React.useState<'config' | 'pins' | 'dictionary'>(
		'config',
	);
	const [isAddPinFormOpen, setIsAddPinFormOpen] = React.useState(false);
	const [isAddDictionaryFormOpen, setIsAddDictionaryFormOpen] = React.useState(false);

	React.useEffect(() => {
		if (!isEqual(editableBox, box)) {
			setIsUpdated(true);
		}
	}, [box]);

	const relatedDictionary = React.useMemo(
		() =>
			schemasStore.dictionaryLinksEntity
				? schemasStore.dictionaryLinksEntity.spec['dictionaries-relation'].filter(
						link => link.box === editableBox.name,
				  )
				: [],
		[schemasStore.dictionaryLinksEntity],
	);

	const dictionaryNamesList = React.useMemo(
		() => schemasStore.dictionaryList.map(dictionary => dictionary.name),
		[schemasStore.dictionaryList],
	);

	const imageNameInput = useInput({
		initialValue: editableBox.spec['image-name'],
		label: 'image-name',
		name: 'image-name',
		id: 'image-name',
	});

	const imageVersionInput = useInput({
		initialValue: editableBox.spec['image-version'],
		label: 'image-version',
		name: 'image-version',
		id: 'image-version',
	});

	const nodePortInput = useInput({
		initialValue: editableBox.spec['node-port']?.toString(),
		label: 'node-port',
		name: 'node-port',
		id: 'node-port',
		validate: value => /^\d+$/.test(value),
	});

	const boxConfigInput = useInput({
		initialValue: editableBox.spec['custom-config']
			? JSON.stringify(editableBox.spec['custom-config'], null, 4)
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
		label: 'Name',
		id: 'pin-name',
	});

	const pinTypeConfigInput = useInput({
		label: 'Connection type',
		id: 'pin-connection-type',
		autocomplete: {
			datalistKey: 'box-settings__connection-type',
			variants: schemasStore.connectionTypes,
		},
		validate: value => schemasStore.connectionTypes.includes(value),
	});

	const relationNameInput = useInput({
		label: 'Name',
		id: 'relation-name',
	});

	const dictionaryNameInput = useInput({
		label: 'Dictionary name',
		id: 'dictionary-name',
		validate: value => dictionaryNamesList.includes(value),
		autocomplete: {
			datalistKey: 'dictionary-name__datalist-key',
			variants: dictionaryNamesList,
		},
	});

	const dictionaryTypeInput = useInput({
		label: 'Dictionary type',
		id: 'dictionary-type',
	});

	const [relatedDictionaryList, setRelatedDictionaryList] = React.useState<DictionaryRelation[]>(
		relatedDictionary,
	);

	const [pinList, setPinList] = React.useState(editableBox.spec.pins ?? []);

	useOutsideClickListener(modalRef, (e: MouseEvent) => {
		if (
			!e
				.composedPath()
				.some(elem => elem instanceof HTMLElement && elem.className.includes('modal'))
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
		if (
			!pinList.find(pin => pin.name === pinNameConfigInput.value) &&
			pinNameConfigInput.value.trim() &&
			pinTypeConfigInput.value.trim() &&
			pinTypeConfigInput.isValid
		) {
			setPinList([
				...pinList,
				{
					name: pinNameConfigInput.value,
					'connection-type': pinTypeConfigInput.value as 'mq' | 'grpc',
					attributes: [],
					filters: [],
				},
			]);
		} else {
			// eslint-disable-next-line no-alert
			window.alert(`Pin ${pinNameConfigInput.value} already exists`);
		}
	};

	const addDictionaryToList = () => {
		if (
			!relatedDictionaryList.find(dictionary => dictionary.name === relationNameInput.value)
		) {
			setRelatedDictionaryList([
				...relatedDictionaryList,
				{
					name: relationNameInput.value,
					box: editableBox.name,
					dictionary: {
						name: dictionaryNameInput.value,
						type: dictionaryTypeInput.value,
					},
				},
			]);
		} else {
			// eslint-disable-next-line no-alert
			window.alert(`Dictionary ${relationNameInput.value} already exists`);
		}
	};

	const submit = async () => {
		if (
			[imageNameInput, imageVersionInput, nodePortInput].every(
				config => config.isValid && config.value.trim(),
			) &&
			boxConfigInput.isValid
		) {
			if (!isUpdated) {
				saveChanges();
				onClose();
			} else {
				onClose();
				await openDecisionModal('Resource has been updated', {
					mainVariant: {
						title: 'Rewrite',
						func: saveChanges,
					},
					variants: [
						{
							title: 'Update',
							// eslint-disable-next-line @typescript-eslint/no-empty-function
							func: () => {},
						},
					],
				});
			}
		}
	};

	const saveChanges = () => {
		schemasStore.configurateBox(
			{
				name: editableBox.name,
				kind: editableBox.kind,
				spec: {
					'image-name': imageNameInput.value,
					'image-version': imageVersionInput.value,
					'node-port': nodePortInput.value ? parseInt(nodePortInput.value) : undefined,
					'custom-config': boxConfigInput.value
						? JSON.parse(boxConfigInput.value)
						: undefined,
					pins: pinList,
					type: editableBox.spec.type,
				},
			},
			{
				dictionaryRelations: relatedDictionaryList,
				createSnapshot: true,
			},
		);
	};

	const updateChanges = () => {
		setEditableBox(box);
		setIsUpdated(false);
	};

	return (
		<>
			<div ref={modalRef} className='modal'>
				<div className='modal__header'>
					<i className='modal__header-icon' />
					<h3 className='modal__header-title'>{editableBox.name}</h3>
					<button onClick={() => onClose()} className='modal__header-close-button'>
						<i className='modal__header-close-button-icon' />
					</button>
				</div>
				<div className='modal__content'>
					{isUpdated && (
						<div className='modal__update'>
							<button onClick={updateChanges} className='modal__update-button'>
								Update
							</button>
							<span className='modal__update-message'>Box has been changed</span>
						</div>
					)}
					<div className='modal__content-switcher'>
						<div
							onClick={() => setCurrentSection('config')}
							className={configButtonClass}>
							Box config
						</div>
						<div onClick={() => setCurrentSection('pins')} className={pinsButtonClass}>
							<i className='modal__content-switcher-button-icon' />
							{`${pinList.length} ${pinList.length === 1 ? 'pin' : 'pins'}`}
						</div>
						<div
							onClick={() => setCurrentSection('dictionary')}
							className={dictionaryButtonClass}>
							{`${relatedDictionaryList.length} ${
								pinList.length === 1 ? 'dictionary' : 'dictionaries'
							}`}
						</div>
					</div>
					{currentSection === 'config' && (
						<BoxConfig
							imageNameInputConfig={imageNameInput}
							imageVersionInputConfig={imageVersionInput}
							nodePortInputConfig={nodePortInput}
							boxConfigInput={boxConfigInput}
						/>
					)}
				</div>
				{currentSection === 'pins' && (
					<PinsList
						pins={pinList}
						removePinFromBox={deletedPin =>
							setPinList(pinList.filter(pin => pin.name !== deletedPin.name))
						}
						setEditablePin={pin => setEditablePin(pin)}
					/>
				)}
				{currentSection === 'dictionary' && (
					<DictionaryList
						dictionaryRelations={relatedDictionaryList}
						removeDictionaryRelation={deletedRelation =>
							setRelatedDictionaryList(
								relatedDictionaryList.filter(
									relation => relation.name !== deletedRelation.name,
								),
							)
						}
					/>
				)}
				<div className='modal__buttons'>
					{currentSection === 'pins' && (
						<button
							onClick={() => setIsAddPinFormOpen(true)}
							className='modal__button add'>
							<i className='modal__button-icon' />
							Add pin
						</button>
					)}
					{currentSection === 'dictionary' && (
						<button
							onClick={() => setIsAddDictionaryFormOpen(true)}
							className='modal__button add'>
							<i className='modal__button-icon' />
							Add dictionary
						</button>
					)}
					<button onClick={submit} className='modal__button submit'>
						<i className='modal__button-icon' />
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

export default observer(BoxSettings);
