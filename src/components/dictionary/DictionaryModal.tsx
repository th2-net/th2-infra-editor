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
import '../../styles/dictionary.scss';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import DictionaryXMLEditor from './DictionaryXmlEditor';
import { downloadFile } from '../../helpers/files';
import useSchemasStore from '../../hooks/useSchemasStore';

interface DictionaryModalProps {
	dictionary?: DictionaryEntity;
	onClose: () => void;
}

const DictionaryModal = ({
	dictionary,
	onClose,
}: DictionaryModalProps) => {
	const schemasStore = useSchemasStore();

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
		initialValue: '',
		label: 'Dictionary name',
		id: 'dicionary-modal__dictionary-name',
	});

	const downloadDictionary = () => {
		if (dictionary) {
			downloadFile(
				dictionaryData.value,
				dictionary.name,
				'text/xml',
			);
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

	const submit = () => {
		if (dictionary && dictionaryData.isValid) {
			schemasStore.configurateDictionary({
				name: dictionary.name,
				kind: 'Th2Dictionary',
				spec: {
					data: dictionaryData.value,
				},
			});
			onClose();
			return;
		}
		if (dictionaryNameInput.isValid && dictionaryData.isValid) {
			schemasStore.createDictionary({
				kind: 'Th2Dictionary',
				name: dictionaryNameInput.value,
				spec: {
					data: dictionaryData.value,
				},
			});
			onClose();
		}
	};

	return (
		<div
			onDragEnter={() => setIsFileDragging(true)}
			onDragExit={() => setIsFileDragging(false)}
			ref={modalRef}
			className="dictionary-modal">
			{
				dictionary
					? <div className="dictionary-modal__row">
						<h2 className="dictionary-modal__title">{dictionary.name}</h2>
						<div className="dictionary-modal__upload-control">
							<label htmlFor="dictionary-file-input">
								<i className="dictionary-modal__button upload"/>
							</label>
							<input
								onChange={uploadDictionary}
								type="file"
								accept=".xml"
								id="dictionary-file-input"/>
						</div>
						<button
							onClick={downloadDictionary}
							className="dictionary-modal__button">
							<i className="dictionary-modal__button download"/>
						</button>
					</div>
					: <Input
						inputConfig={dictionaryNameInput} />
			}
			{
				!isFileDragging
					? <DictionaryXMLEditor
						setDictionaryData={setDictionaryData}
						xmlContent={dictionaryData.value} />
					: <div
						onDrop={dropDictionaryHandler}
						className="dictionary-modal__dragndrop-area"
						draggable="true">
						<i className="dictionary-modal__dragndrop-area-icon"></i>
						<span className="dictionary-modal__dragndrop-area-text">
							Choose a file or drag it here.
						</span>
					</div>
			}
			<div className="box-modal__buttons">
				<button
					onClick={submit}
					className='box-modal__button'>
					{
						dictionary
							? 'Save changes'
							: 'Create'
					}
				</button>
				<button
					onClick={onClose}
					className="box-modal__button">
					Close
				</button>
			</div>
		</div>
	);
};

export default observer(DictionaryModal);
