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
import { ControlledEditor } from '@monaco-editor/react';
import { createBemBlock } from '../../helpers/styleCreators';
import { useInput } from '../../hooks/useInput';
import { defineFileFormat, isJSONValid, isXMLValid, isYAMLValid } from '../../helpers/files';

interface DictionaryEditorProps {
	xmlContent: string;
	setDictionaryData: (dictionaryData: { value: string; isValid: boolean }) => void;
}

const DictionaryEditor = ({ xmlContent, setDictionaryData }: DictionaryEditorProps) => {
	const dictionaryInputConfig = useInput({
		initialValue: xmlContent,
		id: 'dictionary-editor',
		validate: value => {
			if (value.length === 0) return true;
			const contentFormat = defineFileFormat(value);
			switch (contentFormat) {
				case 'xml':
					return isXMLValid(value);
				case 'json':
					return isJSONValid(value);
				case 'yaml':
					return isYAMLValid();
				default:
					return true;
			}
		},
		label: 'Content',
	});

	const editorClass = createBemBlock(
		'textarea',
		!dictionaryInputConfig.isValid ? 'invalid' : null,
	);

	React.useEffect(() => {
		setDictionaryData({
			value: dictionaryInputConfig.value,
			isValid: isXMLValid(dictionaryInputConfig.value),
		});
	}, [dictionaryInputConfig.value]);

	return (
		<div className='textarea-wrapper'>
			<label htmlFor={dictionaryInputConfig.bind.name} className='textarea-label'>
				{dictionaryInputConfig.label}
			</label>
			<ControlledEditor
				height='300px'
				width='auto'
				language={defineFileFormat(dictionaryInputConfig.value)}
				value={dictionaryInputConfig.value}
				options={{
					fontSize: 12,
					codeLens: false,
					contextMenu: false,
					lineNumbers: 'off',
					minimap: {
						enabled: false,
					},
					padding: {
						bottom: 0,
						top: 0,
					},
				}}
				className={editorClass}
				onChange={(_, value) => value && dictionaryInputConfig.setValue(value)}
			/>
		</div>
	);
};

export default DictionaryEditor;
