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
import { useInput } from '../../hooks/useInput';
import { DictionaryEntity } from '../../models/Dictionary';
import Input from '../util/Input';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import DictionaryXMLEditor from './DictionaryXmlEditor';
import { downloadFile } from '../../helpers/files';
import useSchemasStore from '../../hooks/useSchemasStore';
import { isEqual } from '../../helpers/object';
import { openDecisionModal } from '../../helpers/modal';

interface DictionaryModalProps {
	dictionary?: DictionaryEntity;
	onClose: () => void;
}

const DictionaryModal = ({ dictionary, onClose }: DictionaryModalProps) => {
	const schemasStore = useSchemasStore();

	const [editableDictionary, setEditableDictionary] = React.useState<
		DictionaryEntity | undefined
	>(dictionary);
	const [isUpdated, setIsUpdated] = React.useState(false);

	React.useEffect(() => {
		if (dictionary && editableDictionary && !isEqual(editableDictionary, dictionary)) {
			setIsUpdated(true);
		}
	}, [dictionary]);

	const modalRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(modalRef, onClose);

	const [dictionaryData, setDictionaryData] = React.useState<{
		value: string;
		isValid: boolean;
	}>({
		value: dictionary?.spec.data ?? '',
		isValid: true,
	});

	const [isFileDragging, setIsFileDragging] = React.useState(false);

	const dictionaryNameInput = useInput({
		initialValue: dictionary?.name,
		label: 'Dictionary name',
		id: 'dicionary-modal__dictionary-name',
	});

	const downloadDictionary = () => {
		if (dictionary) {
			downloadFile(dictionaryData.value, dictionary.name, 'text/xml');
		}
	};

	const uploadDictionary = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const file = e.target.files[0];
			const data = await file.text();
			setDictionaryData({
				value: data,
				isValid: true,
			});
		}
	};

	const dropDictionaryHandler = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		const data = await file.text();
		setDictionaryData({
			value: data,
			isValid: true,
		});
		setIsFileDragging(false);
	};

	const submit = async () => {
		if (dictionary && dictionaryData.isValid) {
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
			return;
		}
		if (dictionaryNameInput.isValid && dictionaryData.isValid) {
			schemasStore.createDictionary({
				kind: 'Th2Dictionaries',
				name: dictionaryNameInput.value,
				spec: {
					data: dictionaryData.value,
				},
			});
			onClose();
		}
	};

	const saveChanges = () => {
		if (dictionary && dictionaryNameInput.value.trim() && dictionaryNameInput.isValid) {
			schemasStore.configurateDictionary(
				{
					name: dictionaryNameInput.value,
					kind: 'Th2Dictionaries',
					spec: {
						data: dictionaryData.value,
					},
				},
				dictionary,
			);
		}
	};

	const updateChanges = () => {
		setEditableDictionary(dictionary);
		setIsUpdated(false);
	};

	return (
		<div
			onDragEnter={() => setIsFileDragging(true)}
			onDragExit={() => setIsFileDragging(false)}
			ref={modalRef}
			style={{
				width: 'auto',
			}}
			className='modal'>
			<div className='modal__header'>
				<h3 className='modal__header-title'>
					{dictionary ? dictionary.name : 'Create dictionary'}
				</h3>
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
						<span className='modal__update-message'>Dictionary has been changed</span>
					</div>
				)}
				<Input inputConfig={dictionaryNameInput} />
				{!isFileDragging ? (
					<DictionaryXMLEditor
						setDictionaryData={setDictionaryData}
						xmlContent={dictionaryData.value}
					/>
				) : (
					<div
						onDrop={dropDictionaryHandler}
						className='modal__dragndrop-area'
						draggable='true'>
						<i className='modal__dragndrop-area-icon'></i>
						<span className='modal__dragndrop-area-text'>
							Choose a file or drag it here.
						</span>
					</div>
				)}
			</div>
			<div onClick={submit} className='modal__buttons'>
				<div className='modal__upload-control'>
					<label className='modal__button upload' htmlFor='dictionary-file-input'>
						<i className='modal__button-icon' />
						Upload
					</label>
					<input
						onChange={uploadDictionary}
						type='file'
						accept='.xml'
						className='file-input'
						id='dictionary-file-input'
					/>
				</div>
				{dictionary && (
					<button onClick={downloadDictionary} className='modal__button download'>
						<i className='modal__button-icon' />
						Download
					</button>
				)}
				<button className='modal__button submit'>
					<i className='modal__button-icon' />
					Submit
				</button>
			</div>
		</div>
	);
};

export default observer(DictionaryModal);
