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

import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import DictionaryList from './DictionaryList';
import PinsList from './PinsList';
import BoxConfig from './BoxConfig';
import { ModalPortal } from '../util/Portal';
import FormModal from '../util/FormModal';
import { useInput } from '../../hooks/useInput';
import useSchemasStore from '../../hooks/useSchemasStore';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import { openDecisionModal } from '../../helpers/modal';
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import { copyObject, isEqual } from '../../helpers/object';
import { BoxEntity, Pin } from '../../models/Box';
import {
	DictionaryEntity,
	DictionaryRelation,
	MultiDictionaryRelation,
} from '../../models/Dictionary';
import { isValidJSONObject } from '../../helpers/forms';
import '../../styles/modal.scss';
import { isJSONValid } from '../../helpers/files';

interface BoxSettingsProps {
	box: BoxEntity;
	onClose: () => void;
	setEditablePin: (pin: Pin) => void;
	setEditableDictionary: (dictionary: DictionaryEntity) => void;
}

const BoxSettings = ({ box, onClose, setEditablePin, setEditableDictionary }: BoxSettingsProps) => {
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
		setIsUpdated(!isEqual(editableBox, box));
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

	const relatedMultiDictionary = React.useMemo(
		() =>
			(schemasStore.dictionaryLinksEntity &&
				schemasStore.dictionaryLinksEntity.spec['multi-dictionaries-relation'] &&
				schemasStore.dictionaryLinksEntity.spec['multi-dictionaries-relation'].find(
					link => link.box === editableBox.name,
				)) || {
				box: editableBox.name,
				name: `${editableBox.name}-mullti-dict`,
				dictionaries: [],
			},
		[schemasStore.dictionaryLinksEntity],
	);

	const dictionaryNamesList = React.useMemo(
		() => schemasStore.dictionaryList.map(dictionary => dictionary.name),
		[schemasStore.dictionaryList],
	);

	const boxNameInput = useInput({
		initialValue: editableBox.name,
		label: 'name',
		name: 'box-name',
		id: 'box-name',
		validate: name =>
			name.trim().length > 0 &&
			/^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/gm.test(name),
	});

	const imageNameInput = useInput({
		initialValue: editableBox.spec['image-name'],
		label: 'image-name',
		name: 'image-name',
		id: 'image-name',
		validate: name => name.length > 0,
	});

	const imageVersionInput = useInput({
		initialValue: editableBox.spec['image-version'],
		label: 'image-version',
		name: 'image-version',
		id: 'image-version',
		validate: version => version.length > 0,
	});

	const nodePortInput = useInput({
		initialValue: editableBox.spec['node-port']?.toString(),
		label: 'node-port',
		name: 'node-port',
		id: 'node-port',
		validate: value => (value.trim().length === 0 ? true : /^\d+$/.test(value)),
	});

	const boxConfigInput = useInput({
		initialValue: editableBox.spec['custom-config']
			? JSON.stringify(editableBox.spec['custom-config'], null, 4)
			: '',
		label: 'Config',
		validate: isJSONValid,
		name: 'config',
		id: 'config',
	});

	const extendedSettingsInput = useInput({
		initialValue: box.spec['extended-settings']
			? JSON.stringify(box.spec['extended-settings'], null, 4)
			: '',
		label: 'extended-settings',
		validate: isValidJSONObject,
		name: 'extended-settings',
		id: 'extended-settings',
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

	const dictionaryNameInput = useInput({
		label: 'Dictionary name',
		id: 'dictionary-name',
		validate: value => dictionaryNamesList.includes(value),
		autocomplete: {
			datalistKey: 'dictionary-name__datalist-key',
			variants: dictionaryNamesList,
		},
	});

	const dictionaryAliasInput = useInput({
		label: 'Dictionary alias',
		id: 'dictionary-alias',
	});

	const [relatedDictionaryList, setRelatedDictionaryList] =
		React.useState<DictionaryRelation[]>(relatedDictionary);

	const [relatedMultiDictionaryList, setRelatedMultiDictionaryList] =
		React.useState<MultiDictionaryRelation>(relatedMultiDictionary);

	const [pinsList, setPinList] = React.useState(editableBox.spec.pins ?? []);

	useEffect(() => {
		savePins(pinsList);
	}, [pinsList]);

	useEffect(() => {
		saveConfig(boxConfigInput.value);
	}, [boxConfigInput.value]);

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
			!pinsList.find(pin => pin.name === pinNameConfigInput.value) &&
			pinNameConfigInput.value.trim() &&
			pinTypeConfigInput.value.trim() &&
			pinTypeConfigInput.isValid
		) {
			setPinList([
				...pinsList,
				{
					name: pinNameConfigInput.value,
					'connection-type': pinTypeConfigInput.value as 'mq' | 'grpc',
					attributes: [],
					filters: [],
				},
			]);
			pinNameConfigInput.reset();
			pinTypeConfigInput.reset();
		} else {
			window.alert(`Pin ${pinNameConfigInput.value} already exists`);
		}
	};

	const addDictionaryToList = () => {
		if (
			!relatedMultiDictionaryList.dictionaries.find(
				dictionary => dictionary.name === dictionaryNameInput.value,
			)
		) {
			setRelatedMultiDictionaryList({
				...relatedMultiDictionaryList,
				dictionaries: [
					...relatedMultiDictionaryList.dictionaries,
					{
						name: dictionaryNameInput.value,
						alias: dictionaryAliasInput.value,
					},
				],
			});

			[dictionaryNameInput, dictionaryAliasInput].forEach(input => input.reset());
		} else {
			window.alert(`Dictionary ${dictionaryNameInput.value} already exists`);
		}
	};

	const submit = async () => {
		if (
			[
				imageNameInput,
				imageVersionInput,
				nodePortInput,
				boxNameInput,
				boxConfigInput,
				extendedSettingsInput,
			].every(config => config.isValid)
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

	const savePins = (newPinsList: Pin[]) => {
		const copyBox = copyObject(box);
		copyBox.spec.pins = newPinsList;
		schemasStore.configurateBox(editableBox, copyBox, { createSnapshot: true });
	};

	const saveConfig = (value: string) => {
		const copyBox = copyObject(box);
		const customConfig = value ? JSON.parse(value) : undefined;
		if (customConfig) copyBox.spec['custom-config'] = customConfig;
		schemasStore.configurateBox(editableBox, copyBox, { createSnapshot: true });
	};

	const saveChanges = () => {
		const copyBox = copyObject(box);
		copyBox.name = boxNameInput.value;
		copyBox.spec['image-name'] = imageNameInput.value;
		copyBox.spec['image-version'] = imageVersionInput.value;
		copyBox.spec.type = editableBox.spec.type;

		const port = nodePortInput.value ? parseInt(nodePortInput.value) : undefined;
		if (port) copyBox.spec['node-port'] = port;

		const extendedSettings = extendedSettingsInput.value
			? JSON.parse(extendedSettingsInput.value)
			: undefined;
		if (extendedSettings) copyBox.spec['extended-settings'] = extendedSettings;

		schemasStore.configurateBox(editableBox, copyBox, {
			dictionaryRelations: relatedDictionaryList,
			multiDictionaryRelation: relatedMultiDictionaryList,
			createSnapshot: true,
		});
	};

	const updateChanges = () => {
		setEditableBox(box);
		setIsUpdated(false);
	};

	const submitButtonClassname = createStyleSelector(
		'modal__button',
		'submit',
		[
			imageNameInput,
			imageVersionInput,
			nodePortInput,
			boxConfigInput,
			extendedSettingsInput,
		].some(config => !config.isValid)
			? 'disable'
			: null,
	);

	const dictAmount = React.useMemo(
		() =>
			[
				...relatedDictionaryList.map(relation => relation.dictionary),
				...relatedMultiDictionary.dictionaries,
			].filter(
				(dict, ind, self) =>
					ind === self.findIndex(dictSearch => dictSearch.name === dict.name),
			).length,
		[relatedDictionaryList, relatedMultiDictionary],
	);

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
				<div
					className='modal__content'
					style={{
						maxHeight: 500,
						overflow: 'auto',
					}}>
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
							{`${pinsList.length} ${pinsList.length === 1 ? 'pin' : 'pins'}`}
						</div>
						<div
							onClick={() => setCurrentSection('dictionary')}
							className={dictionaryButtonClass}>
							{`${dictAmount} ${dictAmount === 1 ? 'dictionary' : 'dictionaries'}`}
						</div>
					</div>
				</div>
				{currentSection === 'config' && (
					<BoxConfig
						boxNameInputConfig={boxNameInput}
						imageNameInputConfig={imageNameInput}
						imageVersionInputConfig={imageVersionInput}
						nodePortInputConfig={nodePortInput}
						boxConfigInputConfig={boxConfigInput}
						extendedSettingsInputConfig={extendedSettingsInput}
					/>
				)}
				{currentSection === 'pins' && (
					<PinsList
						pins={pinsList}
						removePinFromBox={deletedPin =>
							setPinList(pinsList.filter(pin => pin.name !== deletedPin.name))
						}
						setEditablePin={pin => setEditablePin(pin)}
					/>
				)}
				{currentSection === 'dictionary' && (
					<DictionaryList
						dictionaryRelations={relatedDictionaryList}
						multiDictionaryRelation={relatedMultiDictionaryList}
						removeDictionaryRelation={dictName => {
							setRelatedDictionaryList(
								relatedDictionaryList.filter(
									relation => relation.dictionary.name !== dictName,
								),
							);
							setRelatedMultiDictionaryList({
								...relatedMultiDictionaryList,
								dictionaries: relatedMultiDictionaryList.dictionaries.filter(
									relation => relation.name !== dictName,
								),
							});
						}}
						dictionaryList={schemasStore.dictionaryList}
						setEditableDictionary={dictionary => setEditableDictionary(dictionary)}
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
					<button onClick={submit} className={submitButtonClassname}>
						<i className='modal__button-icon' />
						Submit
					</button>
				</div>
			</div>
			<ModalPortal isOpen={isAddPinFormOpen}>
				<FormModal
					title='Add pin'
					configList={[pinNameConfigInput, pinTypeConfigInput]}
					onSubmit={addPinToList}
					onClose={() => setIsAddPinFormOpen(false)}
				/>
			</ModalPortal>
			<ModalPortal isOpen={isAddDictionaryFormOpen}>
				<FormModal
					title='Add dictionary'
					configList={[dictionaryNameInput, dictionaryAliasInput]}
					onSubmit={addDictionaryToList}
					onClose={() => setIsAddDictionaryFormOpen(false)}
				/>
			</ModalPortal>
		</>
	);
};

export default observer(BoxSettings);
