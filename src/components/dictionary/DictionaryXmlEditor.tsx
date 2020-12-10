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
import AceEditor from 'react-ace';
import { createBemBlock } from '../../helpers/styleCreators';
import { useInput } from '../../hooks/useInput';

import 'ace-builds/src-noconflict/mode-xml';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/ext-language_tools';

interface DictionaryXMLEditorProps {
	xmlContent: string;
	setDictionaryData: (dictionaryData: { value: string; isValid: boolean }) => void;
}

const DictionaryXMLEditor = ({ xmlContent, setDictionaryData }: DictionaryXMLEditorProps) => {
	const isXMLValid = (xml: string) => {
		const parser = new DOMParser();
		const theDom = parser.parseFromString(xml, 'application/xml');
		if (theDom.getElementsByTagName('parsererror').length > 0) {
			return false;
		}
		return true;
	};

	const xmlInputConfig = useInput({
		initialValue: xmlContent,
		id: 'xml-editor',
		validate: xml => (xml.length === 0 ? true : isXMLValid(xml)),
		label: 'XML',
	});

	const editorClass = createBemBlock('textarea', !xmlInputConfig.isValid ? 'invalid' : null);

	React.useEffect(() => {
		setDictionaryData({
			value: xmlInputConfig.value,
			isValid: isXMLValid(xmlInputConfig.value),
		});
	}, [xmlInputConfig.value]);

	return (
		<div className='textarea-wrapper'>
			<label htmlFor={xmlInputConfig.bind.name} className='textarea-label'>
				{xmlInputConfig.label}
			</label>
			<AceEditor
				className={editorClass}
				mode='xml'
				theme='textmate'
				name='config-editor'
				onChange={value => xmlInputConfig.setValue(value)}
				fontSize={12}
				width={'600px'}
				height={'400px'}
				showGutter={false}
				highlightActiveLine={true}
				value={xmlInputConfig.value}
				tabSize={4}
				setOptions={{
					enableBasicAutocompletion: true,
				}}
			/>
		</div>
	);
};

export default DictionaryXMLEditor;
